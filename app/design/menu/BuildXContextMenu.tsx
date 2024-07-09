import { ScopeElement, SiteCtxModeEnum } from "@opensystemslab/buildx-core"
import React from "react"
import SiteContextMenu from "./site/SiteContextMenu"
import BuildingModeContextMenu from "../ui/menu/building/BuildingModeContextMenu"
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

  const mode = scopeElement.elementGroup.houseGroup.scene.contextManager?.mode

  const children = (function () {
    switch (mode) {
      case SiteCtxModeEnum.Enum.SITE:
        return <SiteContextMenu {...{ x, y, scopeElement }} />
      // case SiteCtxModeEnum.Enum.BUILDING:
      //   return <BuildingModeContextMenu {...{ x, y, scopeElement }} />
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
