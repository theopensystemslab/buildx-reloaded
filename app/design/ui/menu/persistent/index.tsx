import { pipe } from "fp-ts/lib/function"
import { O } from "../../../../utils/functions"
import { useScope } from "../../../state/scope"
import { findFirstGuardUp } from "../../../ui-3d/fresh/helpers/sceneQueries"
import { isHouseTransformsGroup } from "../../../ui-3d/fresh/scene/userData"
import ChangeWindows from "../common/ChangeWindows"
import ContextMenu from "../common/ContextMenu"
import { closeMenu, useMenu } from "../../../state/menu"
import ContextMenuHeading from "../common/ContextMenuHeading"

const PersistentMenu = () => {
  const { hovered, selected } = useScope()
  const { x, y } = useMenu()

  return pipe(
    selected ?? hovered,
    O.fromNullable,
    O.chain((scopeElement) => {
      const { object } = scopeElement

      return pipe(
        object,
        findFirstGuardUp(isHouseTransformsGroup),
        O.map((houseTransformsGroup) => (
          <ContextMenu pageX={x} pageY={y} onClose={closeMenu}>
            <ContextMenuHeading>Hi</ContextMenuHeading>
            <ChangeWindows
              {...{ scopeElement, houseTransformsGroup, close: closeMenu }}
            />
          </ContextMenu>
        ))
      )
    }),
    O.toNullable
  )
}

export default PersistentMenu
