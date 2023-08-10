import { Fragment, useRef } from "react"
import { Group, Object3D } from "three"
import { useHousesEvents } from "./events/houses"
import useGestures from "./gestures"
import useKeyTestInteractions from "./useKeyTestInteractions"
import XZPlane from "../XZPlane"
import siteCtx, {
  SiteCtxMode,
  SiteCtxModeEnum,
  useModeChangeListener,
} from "../../state/siteCtx"
import useClippingPlaneHelpers from "./helpers/clippingPlanes"
import { pipe } from "fp-ts/lib/function"
import { O } from "../../../utils/functions"
import { BIG_CLIP_NUMBER } from "./helpers/layouts"
import { invalidate } from "@react-three/fiber"
import {
  getHouseTransformGroup,
  traverseDownUntil,
} from "./helpers/sceneQueries"
import { UserDataTypeEnum } from "./userData"
import { useSubscribeKey } from "../../../utils/hooks"
import scope, { ScopeItem } from "../../state/scope"

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  useHousesEvents(rootRef)

  const bindAll = useGestures()

  // useKeyTestInteractions(rootRef)

  const showHouseStretchHandles = (houseId: string) => {
    pipe(
      getHouseTransformGroup(rootRef, houseId),
      O.map((houseTransformGroup) => {
        houseTransformGroup.traverse((node) => {
          if (node.userData.type === UserDataTypeEnum.Enum.StretchHandleMesh) {
            node.visible = true
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
        node.visible = false
      }
    })
  }

  const { houseLevelIndexToCutHeight, setYCut } =
    useClippingPlaneHelpers(rootRef)

  // const activeRotateHandlesRef = useRef<Object3D | null>(null)
  // const updateActiveRotateHandles = (object: Object3D) => {
  //   if (activeRotateHandlesRef.current !== null) {
  //     activeRotateHandlesRef.current.visible = false
  //   }
  //   activeRotateHandlesRef.current = object
  //   activeRotateHandlesRef.current.visible = true
  // }

  const showHouseRotateHandles = (houseId: string) => {
    pipe(
      getHouseTransformGroup(rootRef, houseId),
      O.map((houseTransformGroup) => {
        houseTransformGroup.traverse((node) => {
          if (node.userData.type === UserDataTypeEnum.Enum.RotateHandlesGroup) {
            node.visible = true
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
    //     setYCut(houseId, BIG_CLIP_NUMBER)
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
