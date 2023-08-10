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
import { A, O, R, S } from "../../../utils/functions"
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
import { values } from "fp-ts-std/Record"

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
    let results: Record<string, string[]> = {}

    mapAllHouseTransformGroups(rootRef, (houseTransformGroup) => {
      const { uuid: houseUuid } = houseTransformGroup

      if (!results[houseUuid]) {
        results[houseUuid] = []
      }

      houseTransformGroup.traverse((node) => {
        if (isElementMesh(node)) {
          const { uuid: materialUuid } = node.material

          if (!results[houseUuid].includes(materialUuid)) {
            results[houseUuid].push(materialUuid)
          }
        }
      })
    })

    const doesAnyHouseIntersectWithAnother = (
      results: Record<string, string[]>
    ): boolean =>
      pipe(
        R.toArray(results),
        A.exists(([houseUuid, uuids]) =>
          pipe(
            results,
            R.filterWithIndex((k2, _) => k2 !== houseUuid),
            R.collect(S.Ord)((_, uuids2) => uuids2),
            A.exists(
              (uuids2) => !A.isEmpty(A.intersection(S.Eq)(uuids, uuids2))
            )
          )
        )
      )

    const noIntersectionsAtAllEver = !doesAnyHouseIntersectWithAnother(results)

    console.log({ noIntersectionsAtAllEver })
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
