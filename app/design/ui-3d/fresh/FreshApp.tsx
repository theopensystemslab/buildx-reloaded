import { invalidate, useThree } from "@react-three/fiber"
import { flow, pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useRef } from "react"
import { Group, Scene } from "three"
import { proxy, ref, useSnapshot } from "valtio"
import { A, O, R, pipeLog, pipeLogWith } from "../../../utils/functions"
import { useSubscribe, useSubscribeKey } from "../../../utils/hooks"
import elementCategories from "../../state/elementCategories"
import XZPlane from "../XZPlane"
import { useHousesEvents } from "./events/houses"
import useModeChange from "./events/modeChange"
import useGestures from "./gestures"
import {
  HouseLayoutGroup,
  HouseLayoutGroupUse,
  HouseTransformsGroup,
  isElementMesh,
  isHouseLayoutGroup,
  isHouseTransformsGroup,
  isWindowTypeAltLayoutGroup,
} from "./scene/userData"
import useVerticalCuts from "./helpers/useVerticalCuts"
import { useExportersWorker } from "../../../workers/exporters/hook"
import scope, { ScopeElement } from "../../state/scope"
import siteCtx from "../../state/siteCtx"
import {
  findFirstGuardAcross,
  objectToHouse,
  objectToHouseObjects,
} from "./helpers/sceneQueries"
import { useKey } from "react-use"
import { floor, random } from "../../../utils/math"
import menu from "../../state/menu"

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

  const clearAltWindows = (houseId: string): void =>
    void pipe(
      rootRef.current?.children,
      O.fromNullable,
      O.chain((children) =>
        pipe(
          children,
          A.findFirst(
            (x): x is HouseTransformsGroup =>
              isHouseTransformsGroup(x) && x.userData.houseId === houseId
          )
        )
      ),
      O.map((houseTransformsGroup) =>
        pipe(
          houseTransformsGroup.children,
          A.filter(isWindowTypeAltLayoutGroup)
        ).forEach((lg) => {
          console.log(`removing ${lg.uuid} FULLY`)
          lg.removeFromParent()
        })
      )
    )

  useSubscribe(scope, () => {
    const item = (menu.open ? scope.selected : null) ?? scope.hovered

    if (!item) {
      console.log(`???`)

      if (lastScopeElement.current) {
        const { houseId } = lastScopeElement.current

        clearAltWindows(houseId)

        lastScopeElement.current = null
      }

      return
    }

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
            // houseTransformsGroup.userData.refreshAltLevelTypeLayouts(item)
          }
          if (refreshWindowAlts) {
            console.log(`refreshing window alts`)
            houseTransformsGroup.userData.refreshAltWindowTypeLayouts(item)
          }
        })
      )
    }

    lastScopeElement.current = scope.hovered
  })

  useKey("c", () => {
    const maybeHouse = pipe(
      rootRef.current?.children ?? [],
      A.findFirst(isHouseTransformsGroup)
    )

    pipe(
      maybeHouse,
      O.map((house) => {
        console.log("get first non-active layout")
        const maybeNextLayout = pipe(
          house.children,
          A.filter(isHouseLayoutGroup),
          pipeLogWith((xs) => xs.map((x) => x.userData.use)),
          A.filter((x) => x.userData.use !== HouseLayoutGroupUse.Enum.ACTIVE),
          (groups) => {
            const i = floor(random() * groups.length)
            return pipe(groups, A.lookup(i))
          }
        )

        pipe(
          maybeNextLayout,
          O.map((nextLayout) => {
            console.log(`set it ${nextLayout.uuid}`)
            house.userData.setActiveLayoutGroup(nextLayout)
            invalidate()
          })
        )
      })
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
