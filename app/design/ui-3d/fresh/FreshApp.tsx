import { invalidate, useThree } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useRef } from "react"
import { Group, Scene } from "three"
import { proxy, ref, useSnapshot } from "valtio"
import { A, O } from "../../../utils/functions"
import { useSubscribe, useSubscribeKey } from "../../../utils/hooks"
import elementCategories from "../../state/elementCategories"
import XZPlane from "../XZPlane"
import { useHousesEvents } from "./events/houses"
import useModeChange from "./events/modeChange"
import useGestures from "./gestures"
import { isElementMesh } from "./scene/userData"
import useVerticalCuts from "./helpers/useVerticalCuts"
import { useExportersWorker } from "../../../workers/exporters/hook"
import scope, { ScopeElement } from "../../state/scope"
import siteCtx from "../../state/siteCtx"
import { objectToHouse, objectToHouseObjects } from "./helpers/sceneQueries"

const sceneProxy = proxy<{ scene: Scene | null }>({
  scene: null,
})

export const useScene = () => {
  const { scene } = useSnapshot(sceneProxy) as typeof sceneProxy
  return scene
}

const FreshApp = () => {
  const rootRef = useRef<Group>(null)

  useHousesEvents(rootRef)
  useModeChange(rootRef)
  useVerticalCuts(rootRef)

  const bindAll = useGestures()

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

  useExportersWorker()

  const scene = useThree((t) => t.scene)

  useEffect(() => {
    if (scene) sceneProxy.scene = ref(scene)
    else sceneProxy.scene = null
  }, [scene])

  const lastScopeElement = useRef<ScopeElement | null>(null)

  useSubscribe(scope, () => {
    if (!scope.selected && !scope.hovered) {
      lastScopeElement.current = null
      return
    }

    const item: ScopeElement = scope.selected ?? (scope.hovered as ScopeElement)

    const { houseId, columnIndex, levelIndex, gridGroupIndex, object } = item

    if (houseId !== siteCtx.houseId) return

    let refreshLevelAlts = true,
      refreshWindowAlts = true

    const last = lastScopeElement.current

    if (last && last.houseId === houseId && last.levelIndex === levelIndex) {
      refreshLevelAlts = false

      if (
        last.columnIndex === columnIndex &&
        last.gridGroupIndex === gridGroupIndex
      ) {
        refreshWindowAlts = false
      }
    }

    if (refreshWindowAlts || refreshLevelAlts) {
      pipe(
        objectToHouse(object),
        O.map((houseTransformsGroup) => {
          if (refreshLevelAlts) {
            houseTransformsGroup.userData.refreshAltLevelTypeLayouts(item)
          }
          if (refreshWindowAlts) {
            houseTransformsGroup.userData.refreshAltWindowTypeLayouts(item)
          }
        })
      )
    }

    lastScopeElement.current = scope.hovered
  })

  return (
    <Fragment>
      <group ref={rootRef} name="WORLD" {...bindAll()}></group>
      <XZPlane />
    </Fragment>
  )
}

export default FreshApp
