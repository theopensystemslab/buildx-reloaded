import { liveQuery } from "dexie"
import { flow, pipe } from "fp-ts/lib/function"
import { Group, Object3D, Plane, Vector3 } from "three"
import { proxy, ref, useSnapshot } from "valtio"
import { subscribeKey } from "valtio/utils"
import { z } from "zod"
import { Element } from "../../../../../server/data/elements"
import { parseDna } from "../../../../../server/data/modules"
import layoutsDB, {
  ColumnLayout,
  getHouseLayoutsKey,
} from "../../../../db/layouts"
import systemsDB from "../../../../db/systems"
import userDB, { House } from "../../../../db/user"
import { A, O, R, S, T } from "../../../../utils/functions"
import {
  setInvisibleNoRaycast,
  setVisible,
  setVisibleAndRaycast,
} from "../../../../utils/three"
import { getExportersWorker, getLayoutsWorker } from "../../../../workers"
import { getSide } from "../../../state/camera"
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
  Layout,
  LayoutType,
  ElementMesh,
  GridGroupUserData,
  HouseLayoutGroup,
  HouseTransformsGroup,
  HouseTransformsGroupUserData,
  HouseTransformsHandlesGroup,
  HouseTransformsHandlesGroupUserData,
  Layouts,
  UserDataTypeEnum,
  isElementMesh,
  isHouseTransformsGroup,
  isHouseTransformsHandlesGroup,
  isRotateHandlesGroup,
  isStretchHandleGroup,
  isXStretchHandleGroup,
  isZStretchHandleGroup,
  ActiveLayout,
  AltLayout,
  isActiveLayout,
} from "./userData"

export const htgProxy = proxy<{ foo: any }>({ foo: null })

export const useHtgFoo = () => useSnapshot(htgProxy).foo

const DEBOUNCE_TIME = 50

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
    case SiteCtxModeEnum.Enum.BUILDING:
    case SiteCtxModeEnum.Enum.LEVEL:
      return HandleTypeEnum.Enum.STRETCH
    case SiteCtxModeEnum.Enum.SITE:
    default:
      return HandleTypeEnum.Enum.ROTATE
  }
}

export const createHouseTransformsGroup = ({
  systemId,
  houseId,
  dnas,
  friendlyName,
  houseTypeId,
  activeElementMaterials,
}: Omit<House, "position" | "rotation">): T.Task<HouseTransformsGroup> => {
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

    const { threeMaterial } = materials[activeElementMaterials[ifcTag]]

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

  const getActiveLayout = (): ActiveLayout =>
    houseTransformsGroup.userData.layouts.active

  const getActiveLayoutGroup = (): HouseLayoutGroup =>
    getActiveLayout().houseLayoutGroup

  const getVisibleLayout = (): Layout => {
    const { layouts } = houseTransformsGroup.userData

    return layouts.preview !== null ? layouts.preview : layouts.active
  }

  const setPreviewLayout = (altLayout: AltLayout | null) => {
    const { layouts } = houseTransformsGroup.userData

    if (altLayout !== null) {
      if (layouts.preview) {
        setInvisibleNoRaycast(layouts.preview.houseLayoutGroup)
      } else {
        setInvisibleNoRaycast(layouts.active.houseLayoutGroup)
      }
      layouts.preview = ref(altLayout)
      setVisibleAndRaycast(layouts.preview.houseLayoutGroup)
    }

    if (altLayout === null) {
      if (layouts.preview) {
        setInvisibleNoRaycast(layouts.preview.houseLayoutGroup)
        houseTransformsGroup.userData.layouts.preview = null
        setVisibleAndRaycast(layouts.active.houseLayoutGroup)
      }
    }
  }

  const dropAltLayoutsByType = (type: LayoutType) => {
    houseTransformsGroup.userData.layouts.alts =
      houseTransformsGroup.userData.layouts.alts.filter((alt) => {
        if (alt.type !== type) return true

        alt.houseLayoutGroup.removeFromParent()
        return false
      })
  }

  const refreshAltSectionTypeLayouts = async () => {
    dropAltLayoutsByType(LayoutType.Enum.ALT_SECTION_TYPE)

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
        houseTransformsGroup,
      })().then((houseLayoutGroup) => {
        houseTransformsGroup.userData.pushAltLayout({
          type: LayoutType.Enum.ALT_SECTION_TYPE,
          houseLayoutGroup,
          sectionType,
        })
      })
    }
  }

  const refreshAltLevelTypeLayouts = async (target: ScopeElement) => {
    dropAltLayoutsByType(LayoutType.Enum.ALT_LEVEL_TYPE)

    const { dna, levelIndex } = target

    const { dnas } = getActiveHouseUserData(houseTransformsGroup)

    const currentLevelTypeCode = parseDna(dna).levelType

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
        houseTransformsGroup,
      })().then((houseLayoutGroup) => {
        pushAltLayout({
          type: LayoutType.Enum.ALT_LEVEL_TYPE,
          houseLayoutGroup,
          levelType,
          target,
        })
        houseLayoutGroup.userData.updateZStretchHandles()
      })
    }
  }

  const refreshAltWindowTypeLayouts: typeof houseTransformsGroup.userData.refreshAltWindowTypeLayouts =
    async (target) => {
      console.log(`dropping`)
      dropAltLayoutsByType(LayoutType.Enum.ALT_WINDOW_TYPE)

      const { columnIndex, levelIndex, moduleIndex } = target

      const side = getSide(houseTransformsGroup)

      const activeLayout = getActiveLayout()

      const { dnas } = activeLayout.houseLayoutGroup.userData

      const altWindowTypeLayouts =
        await getLayoutsWorker().getAltWindowTypeLayouts({
          systemId,
          columnIndex,
          levelIndex,
          moduleIndex,
          dnas,
          side,
        })

      for (let {
        windowType,
        layout,
        dnas,
        candidate,
      } of altWindowTypeLayouts) {
        console.log({ candidate: candidate.dna, windowType: windowType.code })

        await createHouseLayoutGroup({
          systemId: houseTransformsGroup.userData.systemId,
          dnas,
          houseId,
          houseLayout: layout,
          houseTransformsGroup,
        })().then((houseLayoutGroup) => {
          console.log(`pushing`)
          houseTransformsGroup.userData.pushAltLayout({
            type: LayoutType.Enum.ALT_WINDOW_TYPE,
            houseLayoutGroup,
            windowType,
            target,
          })
        })
      }
    }

  const refreshAltResetLayout = async () => {
    systemsDB.houseTypes.get(houseTypeId).then((houseType) => {
      dropAltLayoutsByType(LayoutType.Enum.ALT_RESET)

      if (!houseType) throw new Error(`no house type`)

      getLayoutsWorker()
        .getLayout(houseType)
        .then(async (houseLayout) => {
          const houseLayoutGroup = await createHouseLayoutGroup({
            systemId,
            houseId,
            dnas: houseType.dnas,
            houseLayout,
            houseTransformsGroup,
          })()

          houseTransformsGroup.userData.pushAltLayout({
            type: LayoutType.Enum.ALT_RESET,
            houseLayoutGroup,
            houseType,
          })
        })
    })
  }

  const setActiveLayout = (altLayout: Layout) => {
    const { layouts } = houseTransformsGroup.userData

    if (layouts.preview) layouts.preview = null

    layouts.active = ref({
      type: LayoutType.Enum.ACTIVE,
      houseLayoutGroup: altLayout.houseLayoutGroup,
    })

    layouts.alts = pipe(
      layouts.alts,
      A.filterMap((x) =>
        x.houseLayoutGroup.uuid === layouts.active.houseLayoutGroup.uuid
          ? O.none
          : O.some(ref(x))
      )
    )
  }

  const pushAltLayout = (altLayout: AltLayout) => {
    houseTransformsGroup.userData.layouts.alts.push(ref(altLayout))
    setInvisibleNoRaycast(altLayout.houseLayoutGroup)
    houseTransformsGroup.add(altLayout.houseLayoutGroup)
  }

  const dropAltLayout = ({ houseLayoutGroup }: Layout) => {
    houseTransformsGroup.userData.layouts.alts =
      houseTransformsGroup.userData.layouts.alts.filter((x) => {
        if (x.houseLayoutGroup !== houseLayoutGroup) {
          return true
        }

        houseLayoutGroup.removeFromParent()
        return false
      })
  }

  // ##### HANDLES ######

  // init
  const initRotateAndStretchXHandles = () => {
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
      getVisibleLayout().houseLayoutGroup,
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

  const updateHandles = () => {
    handlesGroup.position.setZ(-getActiveLayoutGroup().userData.length / 2)

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
    houseTransformsGroup.userData.getActiveLayoutGroup().userData.updateBBs()
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
        neighbour.userData.getActiveLayoutGroup().userData

      if (getActiveLayoutGroup().userData.obb.intersectsOBB(nearOBB)) {
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

            const activeLayoutGroup = getActiveLayoutGroup()
            const obb = activeLayoutGroup.userData.obb.clone()
            obb.halfSize.setZ(999)

            if (
              obb.intersectsOBB(
                htg.userData.getActiveLayoutGroup().userData.obb
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
    const dnas = getActiveLayoutGroup().userData.dnas
    const activeElementMaterials =
      houseTransformsGroup.userData.activeElementMaterials

    const { systemId, houseId } = houseTransformsGroup.userData

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
    const dnas = getActiveLayoutGroup().userData.dnas
    const activeElementMaterials =
      houseTransformsGroup.userData.activeElementMaterials

    const { systemId, houseTypeId, houseId, friendlyName } =
      houseTransformsGroup.userData

    const housePayload = {
      systemId,
      houseId,
      houseTypeId,
      activeElementMaterials,
      dnas,
      position,
      rotation,
      friendlyName,
    }

    await Promise.all([
      userDB.houses.add(housePayload),
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
            getLayoutGroupColumnGroups,
            A.head,
            O.chain((columnGroup) => {
              const positionedRows = columnGroup.children
              return pipe(
                positionedRows,
                A.findFirst((positionedRow) => {
                  const gridGroupUserData =
                    positionedRow.userData as GridGroupUserData

                  return gridGroupUserData.levelIndex === levelIndex
                }),
                O.map((gridGroup) => {
                  const { height } = gridGroup.userData as GridGroupUserData
                  return gridGroup.position.y + height / 2
                })
              )
            })
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
    "layouts"
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
    initRotateAndStretchXHandles,
    updateHandles,
    getActiveLayout,
    getActiveLayoutGroup,
    getVisibleLayout,
    setXStretchHandlesVisible,
    setZStretchHandlesVisible,
    setRotateHandlesVisible,
    updateTransforms,
    // layouts
    refreshAltSectionTypeLayouts,
    refreshAltLevelTypeLayouts,
    refreshAltWindowTypeLayouts,
    refreshAltResetLayout,
    pushAltLayout,
    dropAltLayout,
    dropAltLayoutsByType,
    setActiveLayout,
    setPreviewLayout,
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
      })
    ),
    T.map((houseLayoutGroup) => {
      const layouts = proxy<Layouts>({
        active: ref({
          type: LayoutType.Enum.ACTIVE,
          houseLayoutGroup,
        }),
        preview: null,
        alts: [],
      })

      houseTransformsGroup.add(houseLayoutGroup)

      houseTransformsGroup.userData.layouts = layouts

      initRotateAndStretchXHandles()
      updateHandles()
      switchHandlesVisibility()
      setVerticalCuts()

      return houseTransformsGroup
    })
  )
}
