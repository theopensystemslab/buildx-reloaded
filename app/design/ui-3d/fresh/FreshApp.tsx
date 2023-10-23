import { invalidate, useThree } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useRef } from "react"
import { useKey } from "react-use"
import { Group, Scene } from "three"
import { proxy, ref, useSnapshot } from "valtio"
import { A, O, pipeLog, pipeLogWith } from "../../../utils/functions"
import { useSubscribe } from "../../../utils/hooks"
import { floor, random } from "../../../utils/math"
import { useExportersWorker } from "../../../workers/exporters/hook"
import elementCategories from "../../state/elementCategories"
import menu from "../../state/menu"
import scope, { ScopeElement } from "../../state/scope"
import siteCtx from "../../state/siteCtx"
import XZPlane from "../XZPlane"
import { useHousesEvents } from "./events/houses"
import useModeChange from "./events/modeChange"
import useGestures from "./gestures"
import { findFirstGuardDown, objectToHouse } from "./helpers/sceneQueries"
import useVerticalCuts from "./helpers/useVerticalCuts"
import {
  HouseLayoutGroupUse,
  HouseTransformsGroup,
  isElementMesh,
  isHouseLayoutGroup,
  isHouseTransformsGroup,
  isWindowTypeAltLayoutGroup,
} from "./scene/userData"
import { getLayoutsWorker } from "../../../workers"
import { getSide } from "../../state/camera"

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
          lg.removeFromParent()
        })
      )
    )

  useSubscribe(scope, () => {
    const item = (menu.open ? scope.selected : null) ?? scope.hovered

    if (!item) {
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
            houseTransformsGroup.userData.refreshAltWindowTypeLayouts(item)
          }
        })
      )
    }

    lastScopeElement.current = scope.hovered
  })

  const foo = useRef<ScopeElement>({
    columnIndex: 0,
    levelIndex: 0,
    gridGroupIndex: 0,
  } as ScopeElement)

  useKey("k", () => {
    const maybeHtg = pipe(
      rootRef.current?.children ?? [],
      A.findFirst(isHouseTransformsGroup)
    )
    pipe(
      maybeHtg,
      O.map(async (htg) => {
        const { activeLayoutDnas: dnas, systemId } = htg.userData
        await getLayoutsWorker().getAllAltsForWholeHouse({
          systemId,
          dnas,
          side: getSide(htg),
        })
      })
    )
  })

  useKey("d", () => {
    const maybeHtg = pipe(
      rootRef.current?.children ?? [],
      A.findFirst(isHouseTransformsGroup)
    )
    pipe(
      maybeHtg,
      O.map(async (htg) => {
        await htg.userData.refreshAltWindowTypeLayouts(foo.current)
        foo.current.levelIndex++
      })
    )
  })

  useKey("c", () => {
    const maybeHouse = pipe(
      rootRef.current?.children ?? [],
      A.findFirst(isHouseTransformsGroup)
    )

    pipe(
      maybeHouse,
      O.map((house) => {
        const maybeNextLayout = pipe(
          house.children,
          A.filter(isHouseLayoutGroup),
          pipeLogWith((xs) => xs.map((x) => x.userData.use)),
          A.filter((x) => x.userData.use !== HouseLayoutGroupUse.Enum.ACTIVE),
          // A.head
          (groups) => {
            const i = floor(random() * groups.length)
            return pipe(groups, A.lookup(i))
          }
        )

        pipe(
          maybeNextLayout,
          pipeLog,
          O.map((nextLayout) => {
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
