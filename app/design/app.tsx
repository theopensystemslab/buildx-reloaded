"use client"
import type { ScopeElement } from "@opensystemslab/buildx-core"
import { BuildXScene } from "@opensystemslab/buildx-core"
import { useEffect, useRef } from "react"
import { Vector2 } from "three"
import FullScreenContainer from "~/ui/FullScreenContainer"
import { closeMenu, openMenu } from "./state/menu"
import HtmlUi from "./ui/HtmlUi"
import { setSelected } from "./state/scope"

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
    })
  }, [])

  return (
    <FullScreenContainer>
      <canvas ref={canvasRef} className="w-full h-full" />
      <HtmlUi />
    </FullScreenContainer>
  )
}

export default App
