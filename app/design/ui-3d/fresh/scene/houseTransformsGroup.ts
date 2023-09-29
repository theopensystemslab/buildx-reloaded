import { liveQuery } from "dexie"
import { flow, pipe } from "fp-ts/lib/function"
import { Group, Plane, Vector3 } from "three"
import { Element } from "../../../../../server/data/elements"
import layoutsDB, {
  ColumnLayout,
  getHouseLayoutsKey,
} from "../../../../db/layouts"
import userDB, { House } from "../../../../db/user"
import { A, O, R, S, someOrError, T } from "../../../../utils/functions"
import { setInvisibleNoRaycast, setVisible } from "../../../../utils/three"
import { getLayoutsWorker } from "../../../../workers"
import { getModeBools } from "../../../state/siteCtx"
import {
  findAllGuardDown,
  findFirstGuardAcross,
  getActiveHouseUserData,
} from "../helpers/sceneQueries"
import createRotateHandles from "../shapes/rotateHandles"
import createStretchHandle from "../shapes/stretchHandle"
import {
  EnrichedMaterial,
  getSystemElement,
  getSystemMaterial,
} from "../systems"
import { createHouseLayoutGroup } from "./houseLayoutGroup"
import {
  HouseLayoutGroup,
  HouseLayoutGroupUse,
  HouseTransformsGroup,
  HouseTransformsGroupUserData,
  HouseTransformsHandlesGroup,
  HouseTransformsHandlesGroupUserData,
  isActiveLayoutGroup,
  isElementMesh,
  isHouseLayoutGroup,
  isHouseTransformsHandlesGroup,
  isRotateHandlesGroup,
  isXStretchHandleGroup,
  isZStretchHandleGroup,
  UserDataTypeEnum,
} from "./userData"
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
}: House): T.Task<HouseTransformsGroup> => {
  const houseTransformsGroup = new Group() as HouseTransformsGroup

  const NORMAL_DIRECTION = -1

  const clippingPlanes: Plane[] = [
    new Plane(new Vector3(NORMAL_DIRECTION, 0, 0), BIG_CLIP_NUMBER),
    new Plane(new Vector3(0, NORMAL_DIRECTION, 0), BIG_CLIP_NUMBER),
    new Plane(new Vector3(0, 0, NORMAL_DIRECTION), BIG_CLIP_NUMBER),
  ]

  const dbSync = async () => {
    const rotation = houseTransformsGroup.rotation.y
    const position = houseTransformsGroup.position
    const dnas = houseTransformsGroup.userData.activeLayoutDnas
    const activeElementMaterials =
      houseTransformsGroup.userData.activeElementMaterials

    await Promise.all([
      userDB.houses.update(houseId, {
        dnas,
        position,
        rotation,
        activeElementMaterials,
      }),
      getLayoutsWorker().getLayout({ systemId, dnas }),
    ])
  }

  const handlesGroup = new Group() as HouseTransformsHandlesGroup
  // handlesGroup.position.setZ(-layoutGroup.userData.length / 2)

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

    const handlesGroupUserData: HouseTransformsHandlesGroupUserData = {
      type: UserDataTypeEnum.Enum.HouseTransformsHandlesGroup,
    }

    handlesGroup.userData = handlesGroupUserData

    houseTransformsGroup.add(handlesGroup)
  }

  const updateXStretchHandleLengths = () => {
    const { length: houseLength } = getActiveHouseUserData(houseTransformsGroup)

    const xStretchHandles = pipe(
      handlesGroup,
      findAllGuardDown(isXStretchHandleGroup)
    )

    xStretchHandles.forEach((handle) => {
      handle.userData.updateXHandleLength(houseLength)
    })
  }

  const updateActiveLayoutDnas = (nextDnas: string[]) => {
    houseTransformsGroup.userData.activeLayoutDnas = nextDnas
    return dbSync()
  }

  const getActiveLayoutGroup = (): O.Option<HouseLayoutGroup> =>
    pipe(
      houseTransformsGroup.children,
      A.findFirst(
        (x): x is HouseLayoutGroup =>
          x.uuid === houseTransformsGroup.userData.activeLayoutGroupUuid
      )
    )

  const setActiveLayoutGroup = (nextLayoutGroup: HouseLayoutGroup) => {
    pipe(
      houseTransformsGroup.userData.getActiveLayoutGroup(),
      O.map((lastLayoutGroup) => {
        if (lastLayoutGroup === nextLayoutGroup) return
        setVisible(nextLayoutGroup, true)
        setVisible(lastLayoutGroup, false)
      })
    )

    houseTransformsGroup.userData.activeLayoutGroupUuid = nextLayoutGroup.uuid
    houseTransformsGroup.userData.activeLayoutDnas =
      nextLayoutGroup.userData.dnas
  }

  const setXStretchHandlesVisible = (bool: boolean = true) => {
    pipe(
      houseTransformsGroup,
      findFirstGuardAcross(isHouseTransformsHandlesGroup),
      O.map(
        flow(
          findAllGuardDown(isXStretchHandleGroup),
          A.map((x) => void setVisible(x, bool))
        )
      )
    )
  }

  const setZStretchHandlesVisible = (bool: boolean = true) => {
    pipe(
      houseTransformsGroup,
      findFirstGuardAcross(isActiveLayoutGroup),
      O.map(
        flow(
          findAllGuardDown(isZStretchHandleGroup),
          A.map((x) => void setVisible(x, bool))
        )
      )
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
        (x) => x.uuid === houseTransformsGroup.userData.activeLayoutGroupUuid
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
      if (sectionType.code === currentSectionType) continue

      createHouseLayoutGroup({
        systemId: houseTransformsGroup.userData.systemId,
        dnas,
        houseId,
        houseLayout: layout,
        use: HouseLayoutGroupUse.Enum.ALT_SECTION_TYPE,
        houseTransformsGroup,
      })().then((layoutGroup) => {
        setInvisibleNoRaycast(layoutGroup)
        houseTransformsGroup.add(layoutGroup)
      })
    }
  }

  const elements: Record<string, Element> = {}
  const materials: Record<string, EnrichedMaterial> = {}
  const activeElementMaterials: Record<string, string> = {}

  const pushMaterial = (specification: string) => {
    if (!(specification in materials)) {
      const { material, threeMaterial: systemThreeMaterial } =
        getSystemMaterial({
          systemId,
          specification,
        })

      const threeMaterial = systemThreeMaterial.clone()
      threeMaterial.clippingPlanes = clippingPlanes

      materials[specification] = {
        material,
        threeMaterial,
      }
    }
  }

  const pushElement = (ifcTag: string) => {
    const element = getSystemElement({ systemId, ifcTag })

    if (!(ifcTag in elements)) {
      elements[ifcTag] = element
    }

    if (ifcTag in activeElementMaterials) {
      const specification = activeElementMaterials[ifcTag]

      pushMaterial(specification)
    } else {
      pipe(
        [element.defaultMaterial, ...element.materialOptions],
        A.uniq(S.Eq)
      ).forEach((specification) => {
        pushMaterial(specification)
      })

      activeElementMaterials[ifcTag] = element.defaultMaterial
    }

    const { threeMaterial } = materials[activeElementMaterials[ifcTag]]

    return threeMaterial
  }

  const resetMaterials = () => {
    // for each
    pipe(houseTransformsGroup, findAllGuardDown(isElementMesh)).forEach(
      (elementMesh) => {
        const { ifcTag } = elementMesh.userData
        const specification = elements[ifcTag].defaultMaterial

        // pushMaterial here just in case?
        // seems unnecessary

        elementMesh.material = materials[specification].threeMaterial
      }
    )
  }

  const houseTransformsGroupUserData: Omit<
    HouseTransformsGroupUserData,
    "activeLayoutGroupUuid" | "activeLayoutDnas"
  > = {
    type: UserDataTypeEnum.Enum.HouseTransformsGroup,
    systemId,
    houseTypeId,
    houseId,
    clippingPlanes,
    friendlyName,
    elements,
    materials,
    activeElementMaterials,
    pushElement,
    dbSync,
    updateActiveLayoutDnas,
    initRotateAndStretchXHandles,
    updateXStretchHandleLengths,
    getActiveLayoutGroup,
    setActiveLayoutGroup,
    setXStretchHandlesVisible,
    setZStretchHandlesVisible,
    setRotateHandlesVisible,
    updateTransforms,
    refreshAltSectionTypeLayouts,
    resetMaterials,
  }

  houseTransformsGroup.userData =
    houseTransformsGroupUserData as HouseTransformsGroupUserData

  return pipe(
    getHouseLayout({ systemId, dnas }),
    T.chain((houseLayout) =>
      createHouseLayoutGroup({
        houseLayout,
        houseTransformsGroup,
        dnas,
        systemId,
        houseId,
        use: HouseLayoutGroupUse.Enum.INITIAL,
      })
    ),
    T.map((layoutGroup) => {
      houseTransformsGroup.add(layoutGroup)
      houseTransformsGroup.userData.setActiveLayoutGroup(layoutGroup)

      initRotateAndStretchXHandles()

      return houseTransformsGroup
    })
  )
}
