import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Suspense } from "react"
import { Pencil } from "../../../../ui/icons"
import { someOrError } from "../../../../utils/functions"
import { closeMenu } from "../../../state/menu"
import { findFirstGuardUp } from "../../../ui-3d/fresh/helpers/sceneQueries"
import { isHouseTransformsGroup } from "../../../ui-3d/fresh/scene/userData"
import ContextMenu from "../common/ContextMenu"
import ContextMenuButton from "../common/ContextMenuButton"
import { ModeContextMenuProps } from "../common/props"
import ChangeLevelType from "./ChangeLevelType"
import ChangeWindows from "../common/ChangeWindows"
import ChangeMaterial from "../common/ChangeMaterial"
import {
  SiteCtxModeEnum,
  dispatchModeChange,
} from "../../../../db/user/siteCtx"

const BuildingModeContextMenu = ({
  x,
  y,
  scopeElement,
}: ModeContextMenuProps) => {
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
      <ContextMenuButton
        icon={<Pencil />}
        text="Edit level"
        unpaddedSvg
        onClick={() => {
          dispatchModeChange({
            prev: SiteCtxModeEnum.Enum.BUILDING,
            next: SiteCtxModeEnum.Enum.LEVEL,
          })
          close()
        }}
      />

      <ChangeMaterial
        houseTransformsGroup={houseTransformsGroup}
        scopeElement={scopeElement}
        close={close}
      />

      <ChangeWindows
        houseTransformsGroup={houseTransformsGroup}
        scopeElement={scopeElement}
        close={close}
      />

      <ChangeLevelType
        close={close}
        houseTransformsGroup={houseTransformsGroup}
        scopeElement={scopeElement}
      />

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
