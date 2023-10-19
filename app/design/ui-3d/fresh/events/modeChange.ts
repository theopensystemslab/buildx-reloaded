import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { RefObject, useEffect } from "react"
import { Group } from "three"
import scope from "~/design/state/scope"
import siteCtx, {
  ModeChangeEventDetail,
  SiteCtxModeEnum,
  getModeBools,
  useModeChangeListener,
} from "~/design/state/siteCtx"
import { A, O } from "~/utils/functions"
import { useSubscribeKey } from "~/utils/hooks"
import { findFirstGuardAcross } from "../helpers/sceneQueries"
import { modeToHandleTypeEnum } from "../scene/houseTransformsGroup"
import { HouseTransformsGroup, isHouseTransformsGroup } from "../scene/userData"

const useModeChange = (rootRef: RefObject<Group>) => {
  const processHandles = () => {
    if (!rootRef.current) return

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

  const processLevelCuts = () => {
    if (!rootRef.current) return

    const { houseId, levelIndex } = siteCtx

    const { levelMode } = getModeBools()

    const allHouseTransformGroups = pipe(
      rootRef.current.children,
      A.filter(isHouseTransformsGroup)
    )

    allHouseTransformGroups.forEach((htg) => {
      if (levelMode && htg.userData.houseId === houseId) {
        htg.userData.setLevelCut(levelIndex)
      } else {
        htg.userData.setLevelCut(null)
      }
    })
  }

  useSubscribeKey(scope, "selected", processHandles)

  const onModeChange = (incoming: ModeChangeEventDetail) => {
    const { prev, next } = incoming

    if (incoming.houseId) siteCtx.houseId = incoming.houseId
    if (incoming.levelIndex) siteCtx.levelIndex = incoming.levelIndex
    siteCtx.mode = next

    const { mode, houseId } = siteCtx

    switch (mode) {
      case SiteCtxModeEnum.Enum.SITE:
        siteCtx.houseId = null
        siteCtx.levelIndex = null
        break
      case SiteCtxModeEnum.Enum.BUILDING:
        // if site -> building then refresh alt section type layouts
        // ... for x-stretch

        siteCtx.levelIndex = null

        if (prev === SiteCtxModeEnum.Enum.SITE) {
          pipe(
            rootRef.current!,
            findFirstGuardAcross(
              (x): x is HouseTransformsGroup =>
                isHouseTransformsGroup(x) && x.userData.houseId === houseId
            ),
            O.map((houseTransformsGroup) => {
              // houseTransformsGroup.userData.refreshAltSectionTypeLayouts()
            })
          )
        }
        break
      case SiteCtxModeEnum.Enum.LEVEL:
        break
    }

    // always check handles and clipping planes
    processHandles()
    processLevelCuts()
  }

  useModeChangeListener(onModeChange)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void onModeChange({ next: siteCtx.mode }), [])
}

export default useModeChange
