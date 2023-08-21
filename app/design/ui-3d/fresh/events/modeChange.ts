import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { A, O, R } from "~/utils/functions"
import { useSubscribeKey } from "~/utils/hooks"
import {
  setInvisibleNoRaycast,
  setVisibility,
  setVisibleAndRaycast,
} from "~/utils/three"
import scope from "~/design/state/scope"
import siteCtx, {
  getModeBools,
  SiteCtxModeEnum,
  useModeChangeListener,
} from "~/design/state/siteCtx"
import useClippingPlaneHelpers from "../helpers/clippingPlanes"
import { BIG_CLIP_NUMBER, createLayoutGroup } from "../helpers/layouts"
import {
  findAllGuardDown,
  findFirstGuardDown,
  getActiveHouseUserData,
  getActiveLayoutGroup,
} from "../helpers/sceneQueries"
import {
  HouseTransformsGroup,
  isHouseLayoutGroup,
  isHouseTransformsGroup,
  isStretchHandleGroup,
  UserDataTypeEnum,
} from "../userData"
import { RefObject } from "react"
import { Group } from "three"
import layoutsDB from "../../../../db/layouts"

const useModeChange = (rootRef: RefObject<Group>) => {
  const showHouseStretchHandles = (houseId: string) => {
    if (!rootRef.current) return

    const allHouseTransformGroups = pipe(
      rootRef.current.children,
      A.filter(isHouseTransformsGroup)
    )

    pipe(
      allHouseTransformGroups,
      A.findFirst((x) => x.userData.houseId === houseId),
      O.map((houseTransformsGroup) =>
        pipe(
          houseTransformsGroup,
          findAllGuardDown(isStretchHandleGroup)
        ).forEach((handleGroup) => {
          setVisibleAndRaycast(handleGroup)
        })
      )
    )
  }

  const hideAllHandles = () => {
    rootRef.current?.traverse((node) => {
      if (
        node.userData.type === UserDataTypeEnum.Enum.StretchHandleGroup ||
        node.userData.type === UserDataTypeEnum.Enum.RotateHandlesGroup
      ) {
        setInvisibleNoRaycast(node)
      }
    })
  }

  const { houseLevelIndexToCutHeight, setYCut } =
    useClippingPlaneHelpers(rootRef)

  const showHouseRotateHandles = (houseId: string) => {
    if (!rootRef.current) return

    const allHouseTransformGroups = pipe(
      rootRef.current.children,
      A.filter(isHouseTransformsGroup)
    )

    pipe(
      allHouseTransformGroups,
      A.findFirst((x) => x.userData.houseId === houseId),
      O.map((houseTransformsGroup) =>
        houseTransformsGroup.traverse((node) => {
          if (node.userData.type === UserDataTypeEnum.Enum.RotateHandlesGroup) {
            setVisibleAndRaycast(node)
          }
        })
      )
    )
  }

  const processHandles = () => {
    if (!rootRef.current) return

    const { houseId } = siteCtx
    const { selected } = scope
    const { buildingMode, levelMode, siteMode } = getModeBools()

    hideAllHandles()

    if (houseId && (buildingMode || levelMode)) {
      showHouseStretchHandles(houseId)
    }

    if (siteMode) {
      if (selected !== null) {
        const { houseId } = selected
        showHouseRotateHandles(houseId)
      }
    }

    invalidate()
  }

  const processClippingPlanes = () => {
    if (!rootRef.current) return

    const { houseId, levelIndex } = siteCtx
    const { levelMode } = getModeBools()

    const allHouseTransformGroups = pipe(
      rootRef.current.children,
      A.filter(isHouseTransformsGroup)
    )

    pipe(
      allHouseTransformGroups,
      A.findFirst((x) => x.userData.houseId === houseId),
      O.map((houseTransformsGroup) => {
        const { houseId } = getActiveHouseUserData(houseTransformsGroup)
        setYCut(houseId, BIG_CLIP_NUMBER)
      })
    )

    if (levelMode) {
      if (houseId !== null && levelIndex !== null) {
        pipe(
          houseLevelIndexToCutHeight(houseId, levelIndex),
          O.map((cutHeight) => {
            setYCut(houseId, cutHeight)
          })
        )
      }
    }
  }

  useSubscribeKey(scope, "selected", processHandles)
  useModeChangeListener(async ({ previous, next }) => {
    processHandles()
    processClippingPlanes()
    if (
      previous === SiteCtxModeEnum.Enum.SITE &&
      next === SiteCtxModeEnum.Enum.BUILDING
    ) {
      // house Id
      // get the stretch x stuff out of the db?
      // maybe clean out old stuff
      // ultimately pop some alternative invisible layouts in there!

      const { houseId } = siteCtx

      if (!houseId) return

      const dbResult = await layoutsDB.altSectionTypeLayouts.get(houseId)

      if (!dbResult) return

      if (!rootRef.current) return

      pipe(
        rootRef.current,
        findFirstGuardDown((x): x is HouseTransformsGroup => {
          if (!isHouseTransformsGroup(x)) return false
          if (x.userData.houseId !== houseId) return false
          return true
        }),
        O.map((houseTransformsGroup) => {
          const { systemId } = getActiveHouseUserData(houseTransformsGroup)

          pipe(
            dbResult.altSectionTypeLayouts,
            R.map(({ layout, dnas }) => {
              createLayoutGroup({
                systemId,
                houseId,
                houseLayout: layout,
                dnas,
              })().then((layoutGroup) => {
                setVisibility(layoutGroup, false)

                // remove same dnas ones
                pipe(
                  houseTransformsGroup,
                  findAllGuardDown(isHouseLayoutGroup),
                  A.filter(
                    (x) => x.userData.dnas.toString() === dnas.toString()
                  )
                ).forEach((layoutGroup) => {
                  console.log(`removing ${layoutGroup.userData.sectionType}`)
                  layoutGroup.removeFromParent()
                })
                houseTransformsGroup.add(layoutGroup)
                console.log(houseTransformsGroup.children)
              })
            })
          )
        })
      )
    }
  })
}

export default useModeChange
