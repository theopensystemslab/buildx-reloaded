import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { RefObject } from "react"
import { Group } from "three"
import scope from "~/design/state/scope"
import siteCtx, {
  getModeBools,
  SiteCtxModeEnum,
  useModeChangeListener,
} from "~/design/state/siteCtx"
import { A, O } from "~/utils/functions"
import { useSubscribeKey } from "~/utils/hooks"
import { setInvisibleNoRaycast, setVisibleAndRaycast } from "~/utils/three"
import useClippingPlaneHelpers from "../helpers/clippingPlanes"
import {
  findAllGuardDown,
  findFirstGuardAcross,
  getActiveHouseUserData,
} from "../helpers/sceneQueries"
import {
  BIG_CLIP_NUMBER,
  modeToHandleTypeEnum,
} from "../scene/houseTransformsGroup"
import {
  HouseTransformsGroup,
  isHouseTransformsGroup,
  isStretchHandleGroup,
  UserDataTypeEnum,
} from "../scene/userData"

const useModeChange = (rootRef: RefObject<Group>) => {
  // const showHouseStretchHandles = (houseId: string) => {
  //   if (!rootRef.current) return

  //   const allHouseTransformGroups = pipe(
  //     rootRef.current.children,
  //     A.filter(isHouseTransformsGroup)
  //   )

  //   pipe(
  //     allHouseTransformGroups,
  //     A.findFirst((x) => x.userData.houseId === houseId),
  //     O.map((houseTransformsGroup) =>
  //       pipe(
  //         houseTransformsGroup,
  //         findAllGuardDown(isStretchHandleGroup)
  //       ).forEach((handleGroup) => {
  //         setVisibleAndRaycast(handleGroup)
  //       })
  //     )
  //   )
  // }

  // const hideAllHandles = () => {
  //   rootRef.current?.traverse((node) => {
  //     if (
  //       node.userData.type === UserDataTypeEnum.Enum.StretchHandleGroup ||
  //       node.userData.type === UserDataTypeEnum.Enum.RotateHandlesGroup
  //     ) {
  //       setInvisibleNoRaycast(node)
  //     }
  //   })
  // }

  const { houseLevelIndexToCutHeight, setYCut } =
    useClippingPlaneHelpers(rootRef)

  // const showHouseRotateHandles = (houseId: string) => {
  //   if (!rootRef.current) return

  //   const allHouseTransformGroups = pipe(
  //     rootRef.current.children,
  //     A.filter(isHouseTransformsGroup)
  //   )

  //   pipe(
  //     allHouseTransformGroups,
  //     A.findFirst((x) => x.userData.houseId === houseId),
  //     O.map((houseTransformsGroup) =>
  //       houseTransformsGroup.traverse((node) => {
  //         if (node.userData.type === UserDataTypeEnum.Enum.RotateHandlesGroup) {
  //           setVisibleAndRaycast(node)
  //         }
  //       })
  //     )
  //   )
  // }

  const processHandles = () => {
    if (!rootRef.current) return

    const { houseId, mode } = siteCtx
    const { selected } = scope
    const { buildingMode, levelMode, siteMode } = getModeBools()

    pipe(
      rootRef.current.children,

      A.filter(isHouseTransformsGroup),
      A.partition((x) => x.userData.houseId === selected?.houseId),
      ({ left: otherHouses, right: thisHouses }) => {
        pipe(
          thisHouses,
          A.head,
          O.map((thisHouse) => {
            // switch this house's handles by mode
            thisHouse.userData.switchHandlesVisibility(
              modeToHandleTypeEnum(mode)
            )

            // if Site -> Building
            // refresh alt section type layouts
            // for x-stretch

            // if (
            //   prev === SiteCtxModeEnum.Enum.SITE &&
            //   next === SiteCtxModeEnum.Enum.BUILDING
            // ) {
            //   thisHouse.userData.refreshAltSectionTypeLayouts()
            // }
          })
        )

        // hide all other house handles
        otherHouses.forEach((otherHouse) => {
          otherHouse.userData.switchHandlesVisibility()
        })

        invalidate()
      }
    )
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

  useModeChangeListener(({ prev, next }) => {
    // always check handles and clipping planes
    processHandles()
    processClippingPlanes()

    // if site -> building then refresh alt section type layouts
    // ... for x-stretch
    if (
      prev === SiteCtxModeEnum.Enum.SITE &&
      next === SiteCtxModeEnum.Enum.BUILDING
    ) {
      const { houseId } = siteCtx

      pipe(
        rootRef.current!,
        findFirstGuardAcross(
          (x): x is HouseTransformsGroup =>
            isHouseTransformsGroup(x) && x.userData.houseId === houseId
        ),
        O.map((houseTransformsGroup) => {
          houseTransformsGroup.userData.refreshAltSectionTypeLayouts()
        })
      )
    }
  })
}

export default useModeChange
