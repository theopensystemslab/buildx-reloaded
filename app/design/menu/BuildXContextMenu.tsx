import { ScopeElement, SiteCtxModeEnum } from "@opensystemslab/buildx-core"
import React, { useState } from "react"
import SiteModeContextMenuItems from "./site/SiteModeContextMenuItems"
import BuildingModeContextMenuItems from "./building/BuildingModeContextMenuItems"
import LevelModeContextMenu from "../ui/menu/level/LevelModeContextMenu"
import ContextMenu from "./common/ContextMenu"

type Props = {
  scopeElement: ScopeElement
  x: number
  y: number
  close: () => void
}

const BuildXContextMenu = (props: Props) => {
  const { scopeElement, x, y, close } = props

  const [mode, setMode] = useState(
    scopeElement.elementGroup.scene.contextManager?.mode
  )

  const children = (function () {
    switch (mode) {
      case SiteCtxModeEnum.Enum.SITE:
        return (
          <SiteModeContextMenuItems
            {...{ x, y, scopeElement, setMode, close }}
          />
        )
      case SiteCtxModeEnum.Enum.BUILDING:
        return (
          <BuildingModeContextMenuItems
            {...{ x, y, scopeElement, setMode, close }}
          />
        )
      // case SiteCtxModeEnum.Enum.ROW:
      //   return <LevelModeContextMenu {...{ x, y, scopeElement }} />
      default:
        return null
    }
  })()

  return (
    <ContextMenu pageX={x} pageY={y} onClose={close}>
      {children}
    </ContextMenu>
  )
}

export default BuildXContextMenu
