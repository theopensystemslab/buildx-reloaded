import { invalidate } from "@react-three/fiber"
import { closeMenu } from "../../../state/menu"
import ChangeWindows from "../common/ChangeWindows"
import ContextMenu from "../common/ContextMenu"
import { ModeContextMenuProps } from "../common/props"

const BuildingModeContextMenu = ({
  x,
  y,
  scopeElement,
}: ModeContextMenuProps) => {
  const close = () => {
    closeMenu()
    invalidate()
  }

  const { rowIndex, elementGroup } = scopeElement

  const houseGroup = elementGroup.houseGroup

  return (
    <ContextMenu
      {...{
        pageX: x,
        pageY: y,
        onClose: close,
      }}
    >
      {/* <ContextMenuButton
        icon={<Pencil />}
        text="Edit level"
        unpaddedSvg
        onClick={() => {
          dispatchModeChange({
            prev: SiteCtxModeEnum.Enum.BUILDING,
            next: SiteCtxModeEnum.Enum.LEVEL,
            levelIndex: rowIndex,
          })
          close()
        }}
      /> */}

      {/* <ChangeMaterial
        houseTransformsGroup={houseGroup}
        scopeElement={scopeElement}
        close={close}
      /> */}

      <ChangeWindows scopeElement={scopeElement} close={close} />

      {/* <ChangeLevelType
        close={close}
        houseTransformsGroup={houseGroup}
        scopeElement={scopeElement}
      /> */}

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
