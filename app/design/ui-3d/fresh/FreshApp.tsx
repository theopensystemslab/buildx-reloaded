import { invalidate, useThree } from "@react-three/fiber"
import { flow, pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useRef } from "react"
import { Group, Scene, WebGLRenderer } from "three"
import { proxy, ref, snapshot, useSnapshot } from "valtio"
import { A, O } from "../../../utils/functions"
import { useSubscribe } from "../../../utils/hooks"
import elementCategories from "../../state/elementCategories"
import XZPlane from "../XZPlane"
import { useHousesEvents } from "./events/houses"
import useModeChange from "./events/modeChange"
import useGestures from "./gestures"
import useVerticalCuts from "./helpers/useVerticalCuts"
import { isElementMesh, isHouseTransformsGroup } from "./scene/userData"
import { useKey } from "react-use"
import { findFirstGuardDown } from "./helpers/sceneQueries"

const freshAppGlobalsProxy = proxy<{
  scene: Scene | null
  renderer: WebGLRenderer | null
}>({
  scene: null,
  renderer: null,
})

export const useScene = () => {
  const { scene } = useSnapshot(
    freshAppGlobalsProxy
  ) as typeof freshAppGlobalsProxy
  return scene
}

export const getScene = () =>
  snapshot(freshAppGlobalsProxy).scene as typeof freshAppGlobalsProxy.scene

export const getRenderer = () =>
  snapshot(freshAppGlobalsProxy)
    .renderer as typeof freshAppGlobalsProxy.renderer

type Props = {
  controlsEnabled: boolean
}

const FreshApp = ({ controlsEnabled }: Props) => {
  const rootRef = useRef<Group>(null)

  useHousesEvents(rootRef)
  useModeChange(rootRef)
  useVerticalCuts(rootRef)

  const bindAll = useGestures(controlsEnabled)

  useSubscribe(
    elementCategories,
    (...ops) => {
      if (!rootRef.current) return

      pipe(
        ops,
        A.map(
          A.chain(([_, categories, value]: any): any => {
            rootRef.current!.traverse((x) => {
              if (
                isElementMesh(x) &&
                categories.includes(x.userData.category)
              ) {
                x.visible = value
              }
            })
          })
        )
      )
      invalidate()
    },
    false
  )

  // useExportersWorker()

  const { scene, gl: renderer } = useThree()

  useEffect(() => {
    if (scene) freshAppGlobalsProxy.scene = ref(scene)
    else freshAppGlobalsProxy.scene = null

    if (renderer) freshAppGlobalsProxy.renderer = ref(renderer)
    else freshAppGlobalsProxy.renderer = null
  }, [renderer, scene])

  // const lastScopeElement = useRef<ScopeElement | null>(null)

  // useSubscribe(scope, () => {
  //   const item = (menu.open ? scope.selected : null) ?? scope.hovered

  //   if (!item) {
  //     if (lastScopeElement.current) {
  //       const { houseId } = lastScopeElement.current

  //       // clearAltWindows(houseId)

  //       lastScopeElement.current = null
  //     }

  //     return
  //   }

  //   const {
  //     houseId,
  //     columnIndex,
  //     levelIndex,
  //     moduleIndex: gridGroupIndex,
  //     object,
  //   } = item

  //   if (houseId !== siteCtx.houseId) return

  //   let refreshLevelAlts = true,
  //     refreshWindowAlts = true

  //   const last = lastScopeElement.current

  //   if (last && last.houseId === houseId && last.levelIndex === levelIndex) {
  //     refreshLevelAlts = false

  //     if (
  //       last.columnIndex === columnIndex &&
  //       last.moduleIndex === gridGroupIndex
  //     ) {
  //       refreshWindowAlts = false
  //     }
  //   }

  //   if (refreshWindowAlts || refreshLevelAlts) {
  //     pipe(
  //       objectToHouse(object),
  //       O.map((houseTransformsGroup) => {
  //         if (refreshLevelAlts) {
  //           houseTransformsGroup.userData.refreshAltLevelTypeLayouts(item)
  //         }
  //         if (refreshWindowAlts) {
  //           houseTransformsGroup.userData.refreshAltWindowTypeLayouts(item)
  //         }
  //       })
  //     )
  //   }

  //   lastScopeElement.current = item
  // })

  useKey("s", () => {
    pipe(
      rootRef.current,
      O.fromNullable,
      O.map(
        flow(
          findFirstGuardDown(isHouseTransformsGroup),
          O.map((htg) => {
            htg.userData.updatePNG()
          })
        )
      )
    )
  })

  return (
    <Fragment>
      <group ref={rootRef} name="WORLD" {...bindAll()}></group>
      <XZPlane />
    </Fragment>
  )
}

export default FreshApp
