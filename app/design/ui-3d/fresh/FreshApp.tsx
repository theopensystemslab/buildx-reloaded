import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useRef } from "react"
import { Group } from "three"
import { O } from "../../../utils/functions"
import { useSubscribeKey } from "../../../utils/hooks"
import {
  setInvisibleNoRaycast,
  setVisibleAndRaycast,
} from "../../../utils/three"
import scope from "../../state/scope"
import siteCtx, {
  SiteCtxMode,
  SiteCtxModeEnum,
  useModeChangeListener,
} from "../../state/siteCtx"
import XZPlane from "../XZPlane"
import { useHousesEvents } from "./events/houses"
import useGestures from "./gestures"
import useClippingPlaneHelpers from "./helpers/clippingPlanes"
import { BIG_CLIP_NUMBER } from "./helpers/layouts"
import {
  getActiveHouseUserData,
  findHouseTransformsGroupDown,
  mapAllHouseTransformGroups,
} from "./helpers/sceneQueries"
import { UserDataTypeEnum } from "./userData"

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  useHousesEvents(rootRef)

  const bindAll = useGestures()

  // useKeyTestInteractions(rootRef)

  const showHouseStretchHandles = (houseId: string) => {
    pipe(
      findHouseTransformsGroupDown(rootRef, houseId),
      O.map((houseTransformGroup) => {
        houseTransformGroup.traverse((node) => {
          if (node.userData.type === UserDataTypeEnum.Enum.StretchHandleMesh) {
            setVisibleAndRaycast(node)
            // node.visible = true
          }
        })
      })
    )
  }

  const hideAllHandles = () => {
    rootRef.current?.traverse((node) => {
      if (
        node.userData.type === UserDataTypeEnum.Enum.StretchHandleMesh ||
        node.userData.type === UserDataTypeEnum.Enum.RotateHandlesGroup
      ) {
        setInvisibleNoRaycast(node)
        // node.visible = false
      }
    })
  }

  const { houseLevelIndexToCutHeight, setYCut } =
    useClippingPlaneHelpers(rootRef)

  const showHouseRotateHandles = (houseId: string) => {
    pipe(
      findHouseTransformsGroupDown(rootRef, houseId),
      O.map((houseTransformGroup) => {
        houseTransformGroup.traverse((node) => {
          if (node.userData.type === UserDataTypeEnum.Enum.RotateHandlesGroup) {
            setVisibleAndRaycast(node)
          }
        })
      })
    )
  }

  const f = () => {
    const { houseId, levelIndex, mode } = siteCtx
    const { selected } = scope

    const stretchModes: SiteCtxMode[] = [
      SiteCtxModeEnum.Enum.BUILDING,
      SiteCtxModeEnum.Enum.LEVEL,
    ]

    hideAllHandles()
    mapAllHouseTransformGroups(rootRef, (houseTransformGroup) => {
      const { houseId } = getActiveHouseUserData(houseTransformGroup)
      setYCut(houseId, BIG_CLIP_NUMBER)
    })

    if (stretchModes.includes(mode)) {
      if (houseId) showHouseStretchHandles(houseId)
    }

    if (mode === SiteCtxModeEnum.Enum.LEVEL) {
      if (houseId !== null && levelIndex !== null) {
        pipe(
          houseLevelIndexToCutHeight(houseId, levelIndex),
          O.map((cutHeight) => {
            setYCut(houseId, cutHeight)
          })
        )
      }
    }

    if (mode === SiteCtxModeEnum.Enum.SITE) {
      if (selected !== null) {
        const { houseId } = selected
        showHouseRotateHandles(houseId)
      }
    }

    // switch (true) {
    //   default:
    //     if (houseId === null) break
    // }

    invalidate()
  }

  useSubscribeKey(scope, "selected", f)
  useModeChangeListener(f)

  return (
    <Fragment>
      <group ref={rootRef} {...bindAll()}></group>
      <XZPlane />
    </Fragment>
  )
}

export default FreshApp
