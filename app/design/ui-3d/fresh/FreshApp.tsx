import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useRef } from "react"
import { useKey } from "react-use"
import { Group } from "three"
import { A, O } from "../../../utils/functions"
import { useSubscribeKey } from "../../../utils/hooks"
import {
  setInvisibleNoRaycast,
  setVisibility,
  setVisibleAndRaycast,
} from "../../../utils/three"
import scope from "../../state/scope"
import siteCtx, {
  getModeBools,
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
  findAllGuardDown,
  getActiveHouseUserData,
} from "./helpers/sceneQueries"
import createStretchHandle from "./shapes/stretchHandle"
import {
  isHouseTransformsGroup,
  isStretchHandleGroup,
  UserDataTypeEnum,
} from "./userData"

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  useHousesEvents(rootRef)

  const bindAll = useGestures()

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

  const f = () => {
    if (!rootRef.current) return

    const { houseId, levelIndex, mode } = siteCtx
    const { selected } = scope

    const { buildingMode, levelMode, siteMode } = getModeBools()

    console.log(`hide all handles`)
    hideAllHandles()

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

    if (houseId && (buildingMode || levelMode)) {
      console.log("show stretch handles")
      showHouseStretchHandles(houseId)
    }

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

    if (siteMode) {
      if (selected !== null) {
        const { houseId } = selected
        showHouseRotateHandles(houseId)
      }
    }

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
