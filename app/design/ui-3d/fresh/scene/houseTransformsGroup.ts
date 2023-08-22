import { pipe } from "fp-ts/lib/function"
import { Group, Plane, Vector3 } from "three"
import { A, O, pipeLog, T } from "../../../../utils/functions"
import { setVisibility } from "../../../../utils/three"
import { getModeBools } from "../../../state/siteCtx"
import { getActiveHouseUserData } from "../helpers/sceneQueries"
import createRotateHandles from "../shapes/rotateHandles"
import createStretchHandle from "../shapes/stretchHandle"
import {
  HouseLayoutGroup,
  HouseTransformsGroup,
  HouseTransformsGroupUserData,
  isHouseLayoutGroup,
  isStretchHandleGroup,
  StretchHandleGroup,
  UserDataTypeEnum,
} from "../userData"
import { createHouseLayoutGroup, getHouseLayout } from "./houseLayoutGroup"

export const BIG_CLIP_NUMBER = 999

export const createHouseTransformsGroup = ({
  systemId,
  houseId,
  dnas,
  friendlyName,
  houseTypeId,
}: {
  systemId: string
  houseId: string
  dnas: string[]
  friendlyName: string
  houseTypeId: string
}): T.Task<Group> =>
  pipe(
    getHouseLayout({ systemId, dnas }),
    T.chain((houseLayout) =>
      createHouseLayoutGroup({ houseLayout, dnas, systemId, houseId })
    ),
    T.map((layoutGroup) => {
      const houseTransformsGroup = new Group() as HouseTransformsGroup

      const NORMAL_DIRECTION = -1

      const clippingPlanes: Plane[] = [
        new Plane(new Vector3(NORMAL_DIRECTION, 0, 0), BIG_CLIP_NUMBER),
        new Plane(new Vector3(0, NORMAL_DIRECTION, 0), BIG_CLIP_NUMBER),
        new Plane(new Vector3(0, 0, NORMAL_DIRECTION), BIG_CLIP_NUMBER),
      ]

      const initHandles = () => {
        const { width: houseWidth, length: houseLength } =
          getActiveHouseUserData(houseTransformsGroup)

        const { siteMode } = getModeBools()

        const rotateHandles = createRotateHandles({
          houseWidth,
          houseLength,
        })

        setVisibility(rotateHandles, siteMode)

        houseTransformsGroup.add(rotateHandles)

        const stretchXUpHandleGroup = createStretchHandle({
          axis: "x",
          side: 1,
          houseLength,
          houseWidth,
        })

        const stretchXDownHandleGroup = createStretchHandle({
          axis: "x",
          side: -1,
          houseLength,
          houseWidth,
        })

        ;[stretchXUpHandleGroup, stretchXDownHandleGroup].forEach((handle) => {
          handle.position.setZ(houseLength / 2)

          houseTransformsGroup.add(handle)
          setVisibility(handle, !siteMode)
        })
      }

      const syncRotateHandles = () => {}

      const syncWidthHandles = () => {
        const widthHandles = pipe(
          houseTransformsGroup.children,
          A.filter((x): x is StretchHandleGroup => {
            return isStretchHandleGroup(x) && x.userData.axis === "x"
          })
        )

        widthHandles.forEach((handle) => {
          const { length } = getActiveHouseUserData(houseTransformsGroup)
          handle.userData.updateXHandleLength(length)
        })
      }

      const setActiveLayoutGroup = (nextLayoutGroup: HouseLayoutGroup) => {
        pipe(
          houseTransformsGroup.children,
          A.findFirst(
            (x): x is HouseLayoutGroup =>
              isHouseLayoutGroup(x) &&
              x.uuid === houseTransformsGroup.userData.activeLayoutGroupUuid
          ),
          O.map((lastLayoutGroup) => {
            console.log(`in ${nextLayoutGroup.uuid}`)
            console.log(`out ${lastLayoutGroup.uuid}`)
            setVisibility(nextLayoutGroup, true)
            setVisibility(lastLayoutGroup, false)
            houseTransformsGroup.userData.activeLayoutGroupUuid =
              nextLayoutGroup.uuid
          })
        )
      }

      const houseTransformsGroupUserData: HouseTransformsGroupUserData = {
        type: UserDataTypeEnum.Enum.HouseTransformsGroup,
        systemId,
        houseId,
        clippingPlanes,
        friendlyName,
        activeLayoutGroupUuid: layoutGroup.uuid,
        houseTypeId,
        initHandles,
        syncRotateHandles,
        syncWidthHandles,
        setActiveLayoutGroup,
      }
      houseTransformsGroup.userData = houseTransformsGroupUserData

      houseTransformsGroup.add(layoutGroup)

      initHandles()

      return houseTransformsGroup
    })
  )
