import { invalidate, useThree } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useRef } from "react"
import { Group, Scene, WebGLRenderer } from "three"
import { proxy, ref, snapshot, useSnapshot } from "valtio"
import { A } from "../../../utils/functions"
import { useSubscribe } from "../../../utils/hooks"
import elementCategories from "../../state/elementCategories"
import XZPlane from "../XZPlane"
import { useHousesEvents } from "./events/houses"
import useModeChange from "./events/modeChange"
import useGestures from "./gestures"
import useVerticalCuts from "./helpers/useVerticalCuts"
import { isElementMesh } from "./scene/userData"

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

  const { scene, gl: renderer } = useThree()

  useEffect(() => {
    if (scene) freshAppGlobalsProxy.scene = ref(scene)
    else freshAppGlobalsProxy.scene = null

    if (renderer) freshAppGlobalsProxy.renderer = ref(renderer)
    else freshAppGlobalsProxy.renderer = null
  }, [renderer, scene])

  return (
    <Fragment>
      <group ref={rootRef} name="WORLD" {...bindAll()}></group>
      <XZPlane />
    </Fragment>
  )
}

export default FreshApp
