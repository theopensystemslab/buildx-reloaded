import { liveQuery } from "dexie"
import { flow, pipe } from "fp-ts/lib/function"
import { Group, Object3D, Plane, Vector3 } from "three"
import { z } from "zod"
import { Element } from "../../../../../server/data/elements"
import layoutsDB, {
  ColumnLayout,
  getHouseLayoutsKey,
} from "../../../../db/layouts"
import userDB, { House } from "../../../../db/user"
import { A, O, R, S, T, someOrError } from "../../../../utils/functions"
import { setInvisibleNoRaycast, setVisible } from "../../../../utils/three"
import { getExportersWorker, getLayoutsWorker } from "../../../../workers"
import elementCategories from "../../../state/elementCategories"
import scope, { ScopeElement } from "../../../state/scope"
import settings from "../../../state/settings"
import siteCtx, {
  SiteCtxMode,
  SiteCtxModeEnum,
  dispatchModeChange,
  getModeBools,
} from "../../../state/siteCtx"
import {
  findAllGuardDown,
  findFirstGuardAcross,
  getActiveHouseUserData,
  getLayoutGroupColumnGroups,
} from "../helpers/sceneQueries"
import createRotateHandles from "../shapes/rotateHandles"
import createStretchHandle from "../shapes/stretchHandle"
import { EnrichedMaterial, getSystemMaterial } from "../systems"
import { createHouseLayoutGroup } from "./houseLayoutGroup"
import {
  ElementMesh,
  GridGroupUserData,
  HouseLayoutGroup,
  HouseLayoutGroupUse,
  HouseTransformsGroup,
  HouseTransformsGroupUserData,
  HouseTransformsHandlesGroup,
  HouseTransformsHandlesGroupUserData,
  UserDataTypeEnum,
  isActiveLayoutGroup,
  isElementMesh,
  isHouseLayoutGroup,
  isHouseTransformsGroup,
  isHouseTransformsHandlesGroup,
  isRotateHandlesGroup,
  isStretchHandleGroup,
  isXStretchHandleGroup,
  isZStretchHandleGroup,
} from "./userData"
import { parseDna } from "../../../../../server/data/modules"

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

export const HandleTypeEnum = z.enum(["ROTATE", "STRETCH"])
export type HandleTypeEnum = z.infer<typeof HandleTypeEnum>

export const modeToHandleTypeEnum = (mode: SiteCtxMode): HandleTypeEnum => {
  switch (mode) {
    case SiteCtxModeEnum.Enum.SITE:
      return HandleTypeEnum.Enum.ROTATE
    case SiteCtxModeEnum.Enum.BUILDING:
    case SiteCtxModeEnum.Enum.LEVEL:
      return HandleTypeEnum.Enum.STRETCH
  }
}

export const createHouseTransformsGroup = ({
  systemId,
  houseId,
  dnas,
  friendlyName,
  houseTypeId,
  activeElementMaterials,
}: House): T.Task<HouseTransformsGroup> => {
  const houseTransformsGroup = new Group() as HouseTransformsGroup

  const clippingPlanes: Plane[] = [
    new Plane(new Vector3(1, 0, 0), BIG_CLIP_NUMBER),
    new Plane(new Vector3(0, -1, 0), BIG_CLIP_NUMBER),
    new Plane(new Vector3(0, 0, 1), BIG_CLIP_NUMBER),
  ]

  // Save initial states of your clipping planes
  const initialClippingStates = clippingPlanes.map((plane) => ({
    normal: plane.normal.clone(),
    constant: plane.constant,
  }))

  const handlesGroup = new Group() as HouseTransformsHandlesGroup

  // ##### MATERIALS #####

  const elements: Record<string, Element> = {}
  const materials: Record<string, EnrichedMaterial> = {}

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

  const pushElement = (element: Element) => {
    const { ifcTag } = element

    if (!(element.category in elementCategories)) {
      elementCategories[element.category] = true
    }

    if (!(ifcTag in elements)) {
      elements[ifcTag] = element
    }

    pipe(
      [element.defaultMaterial, ...element.materialOptions],
      A.uniq(S.Eq)
    ).forEach((specification) => {
      pushMaterial(specification)
    })

    if (!(ifcTag in activeElementMaterials)) {
      activeElementMaterials[ifcTag] = element.defaultMaterial
    }

    const { threeMaterial, material } =
      materials[activeElementMaterials[ifcTag]]

    return threeMaterial
  }

  const resetMaterials = () => {
    // for each
    pipe(houseTransformsGroup, findAllGuardDown(isElementMesh)).forEach(
      (elementMesh) => {
        const { ifcTag } = elementMesh.userData
        const specification = elements[ifcTag].defaultMaterial

        activeElementMaterials[ifcTag] = specification
        // pushMaterial here just in case?
        // seems unnecessary

        elementMesh.material = materials[specification].threeMaterial
      }
    )
  }

  const changeMaterial = (ifcTag: string, specification: string) => {
    pipe(
      houseTransformsGroup,
      findAllGuardDown(
        (x): x is ElementMesh =>
          isElementMesh(x) && x.userData.ifcTag === ifcTag
      )
    ).forEach((elementMesh) => {
      const { threeMaterial } = materials[specification]
      elementMesh.material = threeMaterial
    })

    activeElementMaterials[ifcTag] = specification
  }

  // ##### LAYOUTS #####

  const updateActiveLayoutDnas = (nextDnas: string[]) => {
    houseTransformsGroup.userData.activeLayoutDnas = nextDnas
    // return dbSync()
  }

  const getActiveLayoutGroup = (): O.Option<HouseLayoutGroup> =>
    pipe(
      houseTransformsGroup.children,
      A.findFirst(
        (x): x is HouseLayoutGroup =>
          x.uuid === houseTransformsGroup.userData.activeLayoutGroupUuid
      )
    )

  const unsafeGetActiveLayoutGroup = (): HouseLayoutGroup =>
    pipe(getActiveLayoutGroup(), someOrError(`no active layout group`))

  const setActiveLayoutGroup = (nextLayoutGroup: HouseLayoutGroup) => {
    pipe(
      houseTransformsGroup.userData.getActiveLayoutGroup(),
      O.map((lastLayoutGroup) => {
        if (lastLayoutGroup === nextLayoutGroup) return
        setVisible(nextLayoutGroup, true)
        setVisible(lastLayoutGroup, false)
        lastLayoutGroup.userData.use = nextLayoutGroup.userData.use
      })
    )

    houseTransformsGroup.userData.activeLayoutGroupUuid = nextLayoutGroup.uuid
    houseTransformsGroup.userData.activeLayoutDnas =
      nextLayoutGroup.userData.dnas
    nextLayoutGroup.userData.use = HouseLayoutGroupUse.Enum.ACTIVE
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

    // out with the old
    oldLayouts.forEach((x) => {
      x.removeFromParent()
    })

    const { dnas, sectionType: currentSectionType } =
      getActiveHouseUserData(houseTransformsGroup)

    // in with the new
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

  const refreshAltLevelTypeLayouts = async ({
    levelIndex,
    dna,
  }: ScopeElement) => {
    const oldLayouts = pipe(
      houseTransformsGroup.children,
      A.filter(
        (x) =>
          isHouseLayoutGroup(x) &&
          x.userData.use === HouseLayoutGroupUse.Enum.ALT_LEVEL_TYPE &&
          x.uuid !== houseTransformsGroup.userData.activeLayoutGroupUuid
      )
    )

    // out with the old
    oldLayouts.forEach((x) => {
      x.removeFromParent()
    })

    const { dnas } = getActiveHouseUserData(houseTransformsGroup)

    const currentLevelTypeCode = parseDna(dna).levelType

    // in with the new
    const altLevelTypeLayouts = await getLayoutsWorker().getAltLevelTypeLayouts(
      {
        systemId,
        dnas,
        levelIndex,
        currentLevelTypeCode,
      }
    )

    for (let { levelType, layout, dnas } of altLevelTypeLayouts) {
      if (levelType.code === currentLevelTypeCode) continue

      createHouseLayoutGroup({
        systemId: houseTransformsGroup.userData.systemId,
        dnas,
        houseId,
        houseLayout: layout,
        use: HouseLayoutGroupUse.Enum.ALT_LEVEL_TYPE,
        houseTransformsGroup,
      })().then((layoutGroup) => {
        setInvisibleNoRaycast(layoutGroup)
        houseTransformsGroup.add(layoutGroup)
      })
    }
  }

  // ##### HANDLES ######

  // init
  const initRotateAndStretchXHandles = () => {
    const { width: houseWidth, length: houseLength } =
      getActiveHouseUserData(houseTransformsGroup)

    const { siteMode } = getModeBools()

    const rotateHandles = createRotateHandles(houseTransformsGroup)
    rotateHandles.userData.update()

    setVisible(rotateHandles, siteMode)

    handlesGroup.add(rotateHandles)

    const stretchXUpHandleGroup = createStretchHandle({
      axis: "x",
      side: 1,
      houseTransformsGroup,
    })

    const stretchXDownHandleGroup = createStretchHandle({
      axis: "x",
      side: -1,
      houseTransformsGroup,
    })

    ;[stretchXUpHandleGroup, stretchXDownHandleGroup].forEach((handle) => {
      // handle.position.setZ(houseLength / 2)

      // setVisible(handle, !siteMode)
      handlesGroup.add(handle)
    })

    const handlesGroupUserData: HouseTransformsHandlesGroupUserData = {
      type: UserDataTypeEnum.Enum.HouseTransformsHandlesGroup,
    }

    handlesGroup.userData = handlesGroupUserData

    houseTransformsGroup.add(handlesGroup)
  }

  // visibility

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

  const updateHandles = () => {
    handlesGroup.position.setZ(
      -unsafeGetActiveLayoutGroup().userData.length / 2
    )

    // const xStretchHandles = pipe(
    //   handlesGroup,
    //   findAllGuardDown(isXStretchHandleGroup)
    // )

    // xStretchHandles.forEach((handle) => {
    //   handle.userData.update()
    // })

    houseTransformsGroup.traverse((node) => {
      if (isRotateHandlesGroup(node)) {
        node.userData.update()
      }

      if (isStretchHandleGroup(node)) {
        node.userData.update()
      }
    })
  }

  const switchHandlesVisibility = (value?: HandleTypeEnum | null) => {
    updateHandles()

    switch (value) {
      case HandleTypeEnum.Enum.ROTATE:
        setRotateHandlesVisible(true)
        setXStretchHandlesVisible(false)
        setZStretchHandlesVisible(false)
        break
      case HandleTypeEnum.Enum.STRETCH:
        setRotateHandlesVisible(false)
        setXStretchHandlesVisible(true)
        setZStretchHandlesVisible(true)
        break
      default:
        setRotateHandlesVisible(false)
        setXStretchHandlesVisible(false)
        setZStretchHandlesVisible(false)
        break
    }
  }

  // ##### COLLISIONS ######

  const updateTransforms = () => {
    houseTransformsGroup.userData.updateDB()
    houseTransformsGroup.userData
      .unsafeGetActiveLayoutGroup()
      .userData.updateBBs()
  }

  const computeNearNeighbours = (
    worldGroup?: Object3D
  ): HouseTransformsGroup[] =>
    pipe(
      houseTransformsGroup.parent,
      O.fromNullable,
      O.match(
        () => O.fromNullable(worldGroup),
        (x) => O.some(x)
      ),
      O.map((scene) =>
        pipe(
          scene.children,
          A.filterMap((htg) => {
            if (
              !isHouseTransformsGroup(htg) ||
              htg.uuid === houseTransformsGroup.uuid
            ) {
              return O.none
            }

            const { aabb } = getActiveHouseUserData(houseTransformsGroup)

            return getActiveHouseUserData(htg).aabb.intersectsBox(aabb)
              ? O.some(htg)
              : O.none
          })
        )
      ),
      O.getOrElse((): HouseTransformsGroup[] => [])
    )

  const checkCollisions = (neighbours: HouseTransformsGroup[]) => {
    let collision = false

    for (const neighbour of neighbours) {
      const { obb: nearOBB } =
        neighbour.userData.unsafeGetActiveLayoutGroup().userData

      if (unsafeGetActiveLayoutGroup().userData.obb.intersectsOBB(nearOBB)) {
        collision = true
        break
      }
    }

    return collision
  }

  const computeLengthWiseNeighbours = () =>
    pipe(
      houseTransformsGroup.parent,
      O.fromNullable,
      O.map((scene) =>
        pipe(
          scene.children,
          A.filterMap((htg) => {
            if (
              !isHouseTransformsGroup(htg) ||
              htg.uuid === houseTransformsGroup.uuid
            ) {
              return O.none
            }

            const activeLayoutGroup = unsafeGetActiveLayoutGroup()
            const obb = activeLayoutGroup.userData.obb.clone()
            obb.halfSize.setZ(999)

            if (
              obb.intersectsOBB(
                htg.userData.unsafeGetActiveLayoutGroup().userData.obb
              )
            ) {
              return O.some(htg)
            }

            return O.none
          })
        )
      ),
      O.getOrElse((): HouseTransformsGroup[] => [])
    )

  // ##### DATABASE ######

  const updateDB = async () => {
    const rotation = houseTransformsGroup.rotation.y
    const position = houseTransformsGroup.position
    const dnas = houseTransformsGroup.userData.activeLayoutDnas
    const activeElementMaterials =
      houseTransformsGroup.userData.activeElementMaterials

    const { systemId, houseTypeId, houseId, friendlyName } =
      houseTransformsGroup.userData

    await Promise.all([
      userDB.houses.update(houseId, {
        dnas,
        position,
        rotation,
        activeElementMaterials,
      }),
      getLayoutsWorker().getLayout({ systemId, dnas }),
    ])

    updateExportModels()
  }

  const addToDB = async () => {
    const rotation = houseTransformsGroup.rotation.y
    const position = houseTransformsGroup.position
    const dnas = houseTransformsGroup.userData.activeLayoutDnas
    const activeElementMaterials =
      houseTransformsGroup.userData.activeElementMaterials

    const { systemId, houseTypeId, houseId, friendlyName } =
      houseTransformsGroup.userData

    await Promise.all([
      userDB.houses.add({
        systemId,
        houseId,
        houseTypeId,
        activeElementMaterials,
        dnas,
        position,
        rotation,
        friendlyName,
      }),
      getLayoutsWorker().getLayout({ systemId, dnas }),
    ])
  }

  const deleteHouse = () => {
    pipe(
      houseTransformsGroup.parent,
      O.fromNullable,
      O.map((worldGroup) => {
        worldGroup.remove(houseTransformsGroup)
        userDB.houses.delete(houseId)
        scope.selected = null
        dispatchModeChange({
          prev: siteCtx.mode,
          next: SiteCtxModeEnum.Enum.SITE,
        })
      })
    )
  }

  const setVerticalCuts: typeof houseTransformsGroupUserData.setVerticalCuts =
    () => {
      const { length, width } = settings.verticalCuts

      ;[0, 2].forEach((i) => {
        const plane = clippingPlanes[i]
        plane.normal.copy(initialClippingStates[i].normal)
        plane.constant = BIG_CLIP_NUMBER
      })

      if (length) {
        clippingPlanes[0].constant = 0
        clippingPlanes[0].applyMatrix4(houseTransformsGroup.matrix)
      }
      if (width) {
        clippingPlanes[2].constant = 0
        clippingPlanes[2].applyMatrix4(houseTransformsGroup.matrix)
      }
    }

  const updateExportModels: typeof houseTransformsGroup.userData.updateExportModels =
    () => {
      const clone = houseTransformsGroup.clone()

      clone.traverse((node) => {
        for (let k of Object.keys(node.userData)) {
          if (!["type"].includes(k)) delete node.userData[k]
        }
      })

      const payload = clone.toJSON()

      getExportersWorker().updateModels({ houseId, payload })

      // function findFunctions(obj: any, path = []) {
      //   // Check if obj is an object
      //   if (typeof obj === "object" && obj !== null) {
      //     // Iterate over all keys in the object
      //     for (const key in obj) {
      //       // Construct a new path for this key
      //       const newPath = path.concat(key as any)

      //       // Check if the property is a function
      //       if (typeof obj[key] === "function") {
      //         console.log("Function found at:", newPath.join("."))
      //       } else {
      //         // If it's another object, recurse into it
      //         findFunctions(obj[key], newPath)
      //       }
      //     }
      //   }
      // }
    }

  const setLevelCut: typeof houseTransformsGroupUserData.setLevelCut = (
    levelIndex
  ) => {
    const { levelMode } = getModeBools()

    const maybeLevelHeight: O.Option<number> =
      !levelMode || siteCtx.houseId !== houseTransformsGroup.userData.houseId
        ? O.none
        : pipe(
            getActiveLayoutGroup(),
            O.chain(
              flow(
                getLayoutGroupColumnGroups,
                A.head,
                O.chain((columnGroup) => {
                  const gridGroups = columnGroup.children
                  return pipe(
                    gridGroups,
                    A.findFirst((gridGroup) => {
                      const gridGroupUserData =
                        gridGroup.userData as GridGroupUserData

                      return gridGroupUserData.levelIndex === levelIndex
                    }),
                    O.map((gridGroup) => {
                      const { height } = gridGroup.userData as GridGroupUserData
                      return gridGroup.position.y + height / 2
                    })
                  )
                })
              )
            )
          )

    pipe(
      maybeLevelHeight,
      O.getOrElse(() => BIG_CLIP_NUMBER),
      (levelHeight) => {
        const {
          clippingPlanes: [, cpy],
        } = getActiveHouseUserData(houseTransformsGroup)
        cpy.constant = levelHeight
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
    setVerticalCuts,
    setLevelCut,
    updateDB,
    updateActiveLayoutDnas,
    initRotateAndStretchXHandles,
    updateHandles,
    getActiveLayoutGroup,
    unsafeGetActiveLayoutGroup,
    setActiveLayoutGroup,
    setXStretchHandlesVisible,
    setZStretchHandlesVisible,
    setRotateHandlesVisible,
    updateTransforms,
    refreshAltSectionTypeLayouts,
    refreshAltLevelTypeLayouts,
    resetMaterials,
    changeMaterial,
    computeNearNeighbours,
    computeLengthWiseNeighbours,
    checkCollisions,
    addToDB,
    deleteHouse,
    switchHandlesVisibility,
    updateExportModels,
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
        use: HouseLayoutGroupUse.Enum.ACTIVE,
      })
    ),
    T.map((layoutGroup) => {
      houseTransformsGroup.add(layoutGroup)
      setActiveLayoutGroup(layoutGroup)
      layoutGroup.userData.updateBBs()

      initRotateAndStretchXHandles()
      updateHandles()

      switchHandlesVisibility()
      setVerticalCuts()

      return houseTransformsGroup
    })
  )
}
