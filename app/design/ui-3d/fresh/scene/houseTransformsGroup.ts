import { pipe } from "fp-ts/lib/function"
import { Group, Plane, Vector3 } from "three"
import userDB from "../../../../db/user"
import { A, O, T } from "../../../../utils/functions"
import { setVisible } from "../../../../utils/three"
import { getModeBools } from "../../../state/siteCtx"
import {
  findAllGuardDown,
  getActiveHouseUserData,
} from "../helpers/sceneQueries"
import createRotateHandles from "../shapes/rotateHandles"
import createStretchHandle from "../shapes/stretchHandle"
import { createHouseLayoutGroup } from "./houseLayoutGroup"
import {
  HouseLayoutGroup,
  HouseTransformsGroup,
  HouseTransformsGroupUserData,
  HouseTransformsHandlesGroup,
  isHouseLayoutGroup,
  isXStretchHandleGroup,
  UserDataTypeEnum,
} from "./userData"
import layoutsDB, {
  ColumnLayout,
  getHouseLayoutsKey,
} from "../../../../db/layouts"
import { R } from "../../../../utils/functions"
import { getLayoutsWorker } from "../../../../workers"
import { liveQuery } from "dexie"
export const BIG_CLIP_NUMBER = 999

let houseLayouts: Record<string, ColumnLayout> = {}
liveQuery(() => layoutsDB.houseLayouts.toArray()).subscribe(
  (dbHouseLayouts) => {
    for (let { systemId, dnas, layout } of dbHouseLayouts) {
      houseLayouts[getHouseLayoutsKey({ systemId, dnas })] = layout
    }
  }
)

const getHouseLayout = ({
  systemId,
  dnas,
}: {
  systemId: string
  dnas: string[]
}): T.Task<ColumnLayout> =>
  pipe(
    houseLayouts,
    R.lookup(getHouseLayoutsKey({ systemId, dnas })),
    O.match(
      (): T.Task<ColumnLayout> => async () => {
        const layoutsWorker = getLayoutsWorker()
        if (!layoutsWorker) throw new Error(`no layouts worker`)
        return await layoutsWorker.getLayout({
          systemId,
          dnas,
        })
      },
      (houseLayout) => T.of(houseLayout)
    )
  )

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

      const handlesGroup = new Group() as HouseTransformsHandlesGroup
      handlesGroup.position.setZ(-layoutGroup.userData.length / 2)

      const initRotateAndStretchXHandles = () => {
        const { width: houseWidth, length: houseLength } =
          getActiveHouseUserData(houseTransformsGroup)

        const { siteMode } = getModeBools()

        const rotateHandles = createRotateHandles({
          houseWidth,
          houseLength,
        })

        setVisible(rotateHandles, siteMode)

        handlesGroup.add(rotateHandles)

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

          handlesGroup.add(handle)
          setVisible(handle, !siteMode)
        })

        houseTransformsGroup.add(handlesGroup)
      }

      const syncLength = () => {
        const { length: houseLength } =
          getActiveHouseUserData(houseTransformsGroup)

        // handlesGroup.position.setZ(-houseLength / 2)

        const xStretchHandles = pipe(
          handlesGroup,
          findAllGuardDown(isXStretchHandleGroup)
        )

        xStretchHandles.forEach((handle) => {
          handle.userData.updateXHandleLength(houseLength)
        })
      }

      const dbSync = () => {
        const rotation = houseTransformsGroup.rotation.y
        const position = houseTransformsGroup.position
        const dnas = houseTransformsGroup.userData.activeLayoutDnas
        userDB.houses.update(houseId, { dnas, position, rotation })
      }

      const updateActiveLayoutDnas = (nextDnas: string[]) => {
        houseTransformsGroup.userData.activeLayoutDnas = nextDnas
        dbSync()
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
            setVisible(nextLayoutGroup, true)
            setVisible(lastLayoutGroup, false)
            houseTransformsGroup.userData.activeLayoutGroupUuid =
              nextLayoutGroup.uuid
            houseTransformsGroup.userData.activeLayoutDnas =
              nextLayoutGroup.userData.dnas
          })
        )
      }

      const setWidthHandlesVisible = (bool: boolean = true) => {
        pipe(
          houseTransformsGroup,
          findAllGuardDown(isXStretchHandleGroup),
          A.map((x) => void setVisible(x, bool))
        )
      }

      const refreshAltLayouts = () => {
        // remove old alts
        // pipe(
        //   houseTransformsGroup.children,
        //   A.filter(
        //     (x): x is HouseLayoutGroup =>
        //       isHouseLayoutGroup(x) && x.uuid !== houseTransformsGroup.uuid
        //   )
        // ).forEach((x) => {
        //   x.removeFromParent()
        // })
        // section type layouts
      }

      const houseTransformsGroupUserData: HouseTransformsGroupUserData = {
        type: UserDataTypeEnum.Enum.HouseTransformsGroup,
        systemId,
        houseTypeId,
        houseId,
        activeLayoutGroupUuid: layoutGroup.uuid,
        activeLayoutDnas: layoutGroup.userData.dnas,
        clippingPlanes,
        friendlyName,
        dbSync,
        updateActiveLayoutDnas,
        initRotateAndStretchXHandles,
        syncLength,
        setActiveLayoutGroup,
        setWidthHandlesVisible,
        refreshAltLayouts,
      }
      houseTransformsGroup.userData = houseTransformsGroupUserData

      houseTransformsGroup.add(layoutGroup)

      initRotateAndStretchXHandles()

      return houseTransformsGroup
    })
  )
