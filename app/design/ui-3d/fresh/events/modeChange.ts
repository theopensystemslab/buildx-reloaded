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
import useClippingPlaneHelpers from "../helpers/clippingPlanes"
import {
  findFirstGuardAcross,
  getActiveHouseUserData,
} from "../helpers/sceneQueries"
import {
  BIG_CLIP_NUMBER,
  modeToHandleTypeEnum,
} from "../scene/houseTransformsGroup"
import { HouseTransformsGroup, isHouseTransformsGroup } from "../scene/userData"

const useModeChange = (rootRef: RefObject<Group>) => {
  const { houseLevelIndexToCutHeight, setYCut } =
    useClippingPlaneHelpers(rootRef)

  const processHandles = () => {
    if (!rootRef.current) return

    console.log(`processHandles`)

    const { mode } = siteCtx
    const { selected } = scope

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
    console.log(0)

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
        console.log(1)
      })
    )

    if (levelMode) {
      if (houseId !== null && levelIndex !== null) {
        pipe(
          houseLevelIndexToCutHeight(houseId, levelIndex),
          O.map((cutHeight) => {
            setYCut(houseId, cutHeight)
            console.log(2)
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
