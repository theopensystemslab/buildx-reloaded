import { pipe } from "fp-ts/lib/function"
import { Group, Matrix3, Plane, Vector3 } from "three"
import userDB from "../../../../db/user"
import { A, O, T } from "../../../../utils/functions"
import { setInvisibleNoRaycast, setVisible } from "../../../../utils/three"
import { getModeBools } from "../../../state/siteCtx"
import {
  findAllGuardDown,
  getActiveHouseUserData,
  getActiveLayoutGroup,
} from "../helpers/sceneQueries"
import createRotateHandles from "../shapes/rotateHandles"
import createStretchHandle from "../shapes/stretchHandle"
import { createHouseLayoutGroup } from "./houseLayoutGroup"
import {
  HouseLayoutGroup,
  HouseLayoutGroupUse,
  HouseTransformsGroup,
  HouseTransformsGroupUserData,
  HouseTransformsHandlesGroup,
  isHouseLayoutGroup,
  isRotateHandlesGroup,
  isXStretchHandleGroup,
  isZStretchHandleGroup,
  UserDataTypeEnum,
} from "./userData"
import layoutsDB, {
  ColumnLayout,
  getHouseLayoutsKey,
} from "../../../../db/layouts"
import { R } from "../../../../utils/functions"
import { getLayoutsWorker } from "../../../../workers"
import { liveQuery } from "dexie"
import { DEBUG } from "../../../state/constants"
import { renderOBB } from "../dimensions"
export const BIG_CLIP_NUMBER = 999

// getHouseLayoutsKey is ONLY for this, not for Dexie.js `get` calls
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
        const { getLayout } = getLayoutsWorker()

        console.log(`getHouseLayout caller`)

        return getLayout({
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
      createHouseLayoutGroup({
        houseLayout,
        dnas,
        systemId,
        houseId,
        use: HouseLayoutGroupUse.Enum.INITIAL,
      })
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

      const updateXStretchHandleLengths = () => {
        const { length: houseLength } =
          getActiveHouseUserData(houseTransformsGroup)
        const xStretchHandles = pipe(
          handlesGroup,
          findAllGuardDown(isXStretchHandleGroup)
        )

        xStretchHandles.forEach((handle) => {
          handle.userData.updateXHandleLength(houseLength)
        })
      }

      const dbSync = async () => {
        const rotation = houseTransformsGroup.rotation.y
        const position = houseTransformsGroup.position
        const dnas = houseTransformsGroup.userData.activeLayoutDnas
        console.log(`dbSync caller`)
        return Promise.all([
          userDB.houses.update(houseId, { dnas, position, rotation }),
          getLayoutsWorker().getLayout({ systemId, dnas }),
        ]).then(() => {})
      }

      const updateActiveLayoutDnas = (nextDnas: string[]) => {
        houseTransformsGroup.userData.activeLayoutDnas = nextDnas
        return dbSync()
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
            if (lastLayoutGroup === nextLayoutGroup) return
            setVisible(nextLayoutGroup, true)
            setVisible(lastLayoutGroup, false)
            houseTransformsGroup.userData.activeLayoutGroupUuid =
              nextLayoutGroup.uuid
            houseTransformsGroup.userData.activeLayoutDnas =
              nextLayoutGroup.userData.dnas
          })
        )
      }

      const setXStretchHandlesVisible = (bool: boolean = true) => {
        pipe(
          houseTransformsGroup,
          findAllGuardDown(isXStretchHandleGroup),
          A.map((x) => void setVisible(x, bool))
        )
      }

      const setZStretchHandlesVisible = (bool: boolean = true) => {
        pipe(
          houseTransformsGroup,
          findAllGuardDown(isZStretchHandleGroup),
          A.map((x) => void setVisible(x, bool))
        )
      }

      const setRotateHandlesVisible = (bool: boolean = true) => {
        pipe(
          houseTransformsGroup,
          findAllGuardDown(isRotateHandlesGroup),
          A.map((x) => void setVisible(x, bool))
        )
      }

      const updateTransforms = () => {
        const rotation = houseTransformsGroup.rotation.y
        const position = houseTransformsGroup.position

        userDB.houses.update(houseId, {
          position,
          rotation,
        })

        pipe(
          houseTransformsGroup.children,
          A.findFirst(
            (x) =>
              x.uuid === houseTransformsGroup.userData.activeLayoutGroupUuid
          ),
          O.map((activeLayoutGroup) => {
            activeLayoutGroup.userData.updateOBB()
          })
        )
      }

      const refreshAltSectionTypeLayouts = async () => {
        const oldLayouts = pipe(
          houseTransformsGroup.children,
          A.filter(
            (x) =>
              isHouseLayoutGroup(x) &&
              x.userData.use === HouseLayoutGroupUse.Enum.ALT_SECTION_TYPE &&
              x.uuid !== houseTransformsGroup.userData.activeLayoutGroupUuid
          )
        )

        oldLayouts.forEach((x) => {
          x.removeFromParent()
        })

        const { dnas, sectionType: currentSectionType } =
          getActiveHouseUserData(houseTransformsGroup)

        const altSectionTypeLayouts =
          await getLayoutsWorker().getAltSectionTypeLayouts({
            systemId,
            dnas,
            currentSectionType,
          })

        for (let { sectionType, layout, dnas } of altSectionTypeLayouts) {
          // post em or refresh em if not exist

          if (sectionType.code === currentSectionType) continue

          createHouseLayoutGroup({
            systemId: houseTransformsGroup.userData.systemId,
            dnas,
            houseId,
            houseLayout: layout,
            use: HouseLayoutGroupUse.Enum.ALT_SECTION_TYPE,
          })().then((layoutGroup) => {
            setInvisibleNoRaycast(layoutGroup)
            houseTransformsGroup.add(layoutGroup)
          })
        }
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
        updateXStretchHandleLengths,
        setActiveLayoutGroup,
        setXStretchHandlesVisible,
        setZStretchHandlesVisible,
        setRotateHandlesVisible,
        updateTransforms,
        refreshAltSectionTypeLayouts,
      }
      houseTransformsGroup.userData = houseTransformsGroupUserData

      houseTransformsGroup.add(layoutGroup)

      initRotateAndStretchXHandles()

      return houseTransformsGroup
    })
  )
