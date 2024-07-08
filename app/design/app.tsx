"use client"
import type { ScopeElement } from "@opensystemslab/buildx-core"
import {
  BuildXScene,
  cachedHousesTE,
  defaultCachedHousesOps,
  houseGroupTE,
} from "@opensystemslab/buildx-core"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useRef } from "react"
import { Vector2 } from "three"
import FullScreenContainer from "~/ui/FullScreenContainer"
import { A, TE } from "~/utils/functions"
import { closeMenu, openMenu } from "./state/menu"
import { setSelected } from "./state/scope"
import { setSidebar } from "./state/settings"
import HtmlUi from "./ui/HtmlUi"

let scene: BuildXScene | null = null

export const getBuildXScene = (): BuildXScene | null => {
  return scene
}

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current || scene !== null) return

    const f = (scopeElement: ScopeElement, xy: Vector2): void => {
      const { x, y } = xy
      setSelected(scopeElement)
      openMenu(x, y)
    }

    scene = new BuildXScene({
      canvas: canvasRef.current,
      onLongTapBuildElement: f,
      onRightClickBuildElement: f,
      onTapMissed: closeMenu,
      ...defaultCachedHousesOps,
    })

    pipe(
      cachedHousesTE,
      TE.map((houses) => {
        // this is new
        if (houses.length === 0) setSidebar(true)

        pipe(
          houses,
          A.traverse(TE.ApplicativePar)(
            ({
              houseId,
              systemId,
              friendlyName,
              houseTypeId,
              dnas,
              position: { x, y, z },
              activeElementMaterials,
              rotation,
            }) =>
              pipe(
                {
                  houseId,
                  systemId,
                  friendlyName,
                  houseTypeId,
                  dnas,
                },
                houseGroupTE,
                TE.map((houseGroup) => {
                  houseGroup.position.set(x, y, z)
                  houseGroup.rotation.set(0, rotation, 0)
                  scene?.addHouseGroup(houseGroup)
                })
              )
          )
        )
      })
    )()
  }, [])

  return (
    <FullScreenContainer>
      <canvas ref={canvasRef} className="w-full h-full" />
      <HtmlUi />
    </FullScreenContainer>
  )
}

export default App
