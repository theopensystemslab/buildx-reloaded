import { Fragment, useRef } from "react"
import { Group, Material, Mesh, Object3D, Plane } from "three"
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
import { A, O } from "../../../utils/functions"
import { BIG_CLIP_NUMBER } from "./helpers/layouts"
import { invalidate } from "@react-three/fiber"
import {
  getActiveHouseUserData,
  getHouseTransformGroup,
  mapAllHouseTransformGroups,
  traverseDownUntil,
} from "./helpers/sceneQueries"
import {
  isElementMesh,
  isHouseTransformsGroup,
  UserDataTypeEnum,
} from "./userData"
import { useSubscribeKey } from "../../../utils/hooks"
import scope, { ScopeItem } from "../../state/scope"
import { useKey } from "react-use"

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

  useKey("q", () => {
    pipe(
      rootRef.current?.children ?? [],
      A.filter(isHouseTransformsGroup),
      A.map((houseTransformGroup) => {
        traverseDownUntil(houseTransformGroup, (object) => {
          if (isElementMesh(object)) {
            // const clippingPlaneUuids = object.material.clippingPlanes
            //   .map((x: Plane) =>
            //   .join(",")
            // console.log(
            //   `houseUuid: ${houseTransformGroup.uuid}; planesUuids: ${clippingPlaneUuids}`
            // )
            console.log(object.material.clippingPlanes)
            return true
          }
          return false
        })
      })
    )
  })

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
            console.log({
              selected: selected?.houseId,
              siteCtx: siteCtx.houseId,
            })
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
