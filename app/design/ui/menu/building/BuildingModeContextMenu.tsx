import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Pencil } from "../../../../ui/icons"
import { someOrError } from "../../../../utils/functions"
import { closeMenu } from "../../../state/menu"
import { SiteCtxModeEnum, dispatchModeChange } from "../../../state/siteCtx"
import { findFirstGuardUp } from "../../../ui-3d/fresh/helpers/sceneQueries"
import { isHouseTransformsGroup } from "../../../ui-3d/fresh/scene/userData"
import ChangeMaterial from "../common/ChangeMaterial"
import ChangeWindows from "../common/ChangeWindows"
import ContextMenu from "../common/ContextMenu"
import ContextMenuButton from "../common/ContextMenuButton"
import { ModeContextMenuProps } from "../common/props"
import ChangeLevelType from "./ChangeLevelType"

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
