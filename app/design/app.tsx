"use client"
import { Add } from "@carbon/icons-react"
import type { ScopeElement, SiteCtxMode } from "@opensystemslab/buildx-core"
import {
  BuildXScene,
  cachedHousesTE,
  defaultCachedHousesOps,
  houseGroupTE,
} from "@opensystemslab/buildx-core"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useRef, useState } from "react"
import usePortal from "react-cool-portal"
import { Vector2 } from "three"
import FullScreenContainer from "~/ui/FullScreenContainer"
import IconButton from "~/ui/IconButton"
import { Menu } from "~/ui/icons"
import { A, TE } from "~/utils/functions"
import BuildXContextMenu from "./menu/BuildXContextMenu"
import ObjectsSidebar from "./ui/objects-sidebar/ObjectsSidebar"

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

  const closeContextMenu = () => setContextMenu(null)

  const [mode, setMode] = useState<SiteCtxMode | null>(null)

  const [objectsSidebar, setObjectsSidebar] = useState(false)

  const [universalMenu, setUniversalMenu] = useState(false)

  const { Portal: HeaderEndPortal } = usePortal({
    containerId: "headerEnd",
    autoRemoveContainer: false,
    internalShowHide: false,
  })

  const { Portal: HeaderStartPortal } = usePortal({
    containerId: "headerStart",
    autoRemoveContainer: false,
    internalShowHide: false,
  })

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
      onTapMissed: closeContextMenu,
      onModeChange: (_, next) => {
        setMode(next)
      },
    })

    pipe(
      cachedHousesTE,
      TE.chain((houses) => {
        // this is new
        if (houses.length === 0) setObjectsSidebar(true)

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
      <HeaderEndPortal>
        <div className="flex items-center justify-end">
          <IconButton onClick={() => setObjectsSidebar(true)}>
            <div className="flex items-center justify-center">
              <Add size={32} />
            </div>
          </IconButton>
          <IconButton onClick={() => setUniversalMenu(true)}>
            <Menu />
          </IconButton>
        </div>
      </HeaderEndPortal>

      <ObjectsSidebar
        expanded={objectsSidebar}
        close={() => setObjectsSidebar(false)}
      />

      {/* <UniversalMenu
        open={universalMenu}
        close={() => setUniversalMenu(false)}
      /> */}

      {contextMenu && (
        <BuildXContextMenu
          {...contextMenu}
          mode={mode}
          setMode={setMode}
          close={closeContextMenu}
        />
      )}
    </FullScreenContainer>
  )
}

export default App
