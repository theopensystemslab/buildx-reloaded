import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { someOrError } from "../../../../utils/functions"
import { closeMenu } from "../../../state/menu"
import { findFirstGuardUp } from "../../../ui-3d/fresh/helpers/sceneQueries"
import { isHouseTransformsGroup } from "../../../ui-3d/fresh/scene/userData"
import ChangeMaterial from "../common/ChangeMaterial"
import ChangeWindows from "../common/ChangeWindows"
import ContextMenu from "../common/ContextMenu"
import { ModeContextMenuProps } from "../common/props"

const LevelModeContextMenu = ({ x, y, scopeElement }: ModeContextMenuProps) => {
  const close = () => {
    closeMenu()
    invalidate()
  }

  const houseTransformsGroup = pipe(
    scopeElement.object,
    findFirstGuardUp(isHouseTransformsGroup),
    someOrError(
      `no HouseTransformsGroup found upwards of: ${JSON.stringify(
        scopeElement,
        null,
        2
      )}`
    )
  )

  return (
    <ContextMenu
      {...{
        pageX: x,
        pageY: y,
        onClose: close,
      }}
    >
      <ChangeMaterial
        houseTransformsGroup={houseTransformsGroup}
        scopeElement={scopeElement}
        close={close}
      />

      {/* <ChangeWindows
        houseTransformsGroup={houseTransformsGroup}
        scopeElement={scopeElement}
        close={close}
      /> */}
    </ContextMenu>
  )
}

export default LevelModeContextMenu
