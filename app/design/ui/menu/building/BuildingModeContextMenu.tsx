import { Pencil } from "../../../../ui/icons"
import ChangeLevelType from "./ChangeLevelType"
import ContextMenu from "../common/ContextMenu"
import ContextMenuButton from "../common/ContextMenuButton"
import { ModeContextMenuProps } from "../common/props"
import { downMode } from "../../../state/siteCtx"
import { closeMenu } from "../../../state/menu"
import { invalidate } from "@react-three/fiber"

const BuildingModeContextMenu = ({
  x,
  y,
  scopeElement,
}: ModeContextMenuProps) => {
  const close = () => {
    closeMenu()
    invalidate()
  }

  return (
    <ContextMenu
      {...{
        pageX: x,
        pageY: y,
        onClose: close,
      }}
    >
      <ContextMenuButton
        icon={<Pencil />}
        text="Edit level"
        unpaddedSvg
        onClick={() => {
          downMode(scopeElement)
          close()
        }}
      />
      {/* <ChangeMaterials
        houseId={houseId}
        elementName={ifcTag}
        onComplete={props.onClose}
      /> */}

      {/* <ChangeWindows
        {...{
          houseId,
          columnIndex,
          levelIndex,
          gridGroupIndex,
          onComplete: props.onClose,
        }}
      /> */}
      <ChangeLevelType {...{ scopeElement }} />
      {/* <AddRemoveLevels
        {...{
          houseId,
          columnIndex,
          levelIndex,
          gridGroupIndex,
          onComplete: props.onClose,
        }}
      /> */}
    </ContextMenu>
  )
}

export default BuildingModeContextMenu
