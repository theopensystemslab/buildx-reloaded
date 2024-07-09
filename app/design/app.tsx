"use client"
import type { ScopeElement, SiteCtxMode } from "@opensystemslab/buildx-core"
import {
  BuildXScene,
  cachedHousesTE,
  defaultCachedHousesOps,
  houseGroupTE,
} from "@opensystemslab/buildx-core"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useRef, useState } from "react"
import { Vector2 } from "three"
import FullScreenContainer from "~/ui/FullScreenContainer"
import { A, TE } from "~/utils/functions"
import { setSidebar } from "./state/settings"
import BuildXContextMenu from "./menu/BuildXContextMenu"
import HtmlUi from "./ui/HtmlUi"

let scene: BuildXScene | null = null

export const getBuildXScene = (): BuildXScene | null => {
  return scene
}

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [contextMenu, setContextMenu] = useState<{
    scopeElement: ScopeElement
    x: number
    y: number
  } | null>(null)

  const [mode, setMode] = useState<SiteCtxMode | null>(null)

  const close = () => setContextMenu(null)

  useEffect(() => {
    if (!canvasRef.current || scene !== null) return

    const contextMenu = (scopeElement: ScopeElement, xy: Vector2): void => {
      const { x, y } = xy

      setContextMenu({
        scopeElement,
        x,
        y,
      })

      setMode(scopeElement.elementGroup.scene.contextManager?.mode ?? null)
      // setSelected(scopeElement)
      // openMenu(x, y)
    }

    scene = new BuildXScene({
      canvas: canvasRef.current,
      ...defaultCachedHousesOps,
      onLongTapBuildElement: contextMenu,
      onRightClickBuildElement: contextMenu,
      onTapMissed: close,
      onModeChange: (prev, next) => {
        setMode(next)
      },
    })

    pipe(
      cachedHousesTE,
      TE.chain((houses) => {
        // this is new
        if (houses.length === 0) setSidebar(true)

        console.log(houses)

        return pipe(
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
      {contextMenu && (
        <BuildXContextMenu
          {...contextMenu}
          mode={mode}
          setMode={setMode}
          close={close}
        />
      )}
      <HtmlUi />
    </FullScreenContainer>
  )
}

export default App
