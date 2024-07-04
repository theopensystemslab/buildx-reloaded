import { invalidate } from "@react-three/fiber"
import { closeMenu } from "../../../state/menu"
import ChangeWindows from "../common/ChangeWindows"
import ContextMenu from "../common/ContextMenu"
import { ModeContextMenuProps } from "../common/props"

const LevelModeContextMenu = ({ x, y, scopeElement }: ModeContextMenuProps) => {
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
      {/* <ChangeMaterial
        scopeElement={scopeElement}
        close={close}
      /> */}

      <ChangeWindows scopeElement={scopeElement} close={close} />
    </ContextMenu>
  )
}

export default LevelModeContextMenu
