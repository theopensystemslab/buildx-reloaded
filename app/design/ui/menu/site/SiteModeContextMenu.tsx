import { TrashCan } from "@carbon/icons-react"
import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useState } from "react"
import userDB from "../../../../db/user"
import { Pencil, TextCursor } from "../../../../ui/icons"
import { someOrError } from "../../../../utils/functions"
import { closeMenu } from "../../../state/menu"
import {
  SiteCtxModeEnum,
  dispatchModeChange,
} from "../../../../db/user/siteCtx"
import { findFirstGuardUp } from "../../../ui-3d/fresh/helpers/sceneQueries"
import { isHouseTransformsGroup } from "../../../ui-3d/fresh/scene/userData"
import RenameForm from "../../RenameForm"
import ContextMenu from "../common/ContextMenu"
import ContextMenuButton from "../common/ContextMenuButton"
import Exporters from "../common/Exporters"
import { ModeContextMenuProps } from "../common/props"
import ResetContextMenuButton from "./ResetContextMenuButton"
import { dispatchOutline } from "../../../ui-3d/fresh/events/outlines"

const SiteModeContextMenu = ({ x, y, scopeElement }: ModeContextMenuProps) => {
  const { object } = scopeElement

  const close = () => {
    closeMenu()
    invalidate()
  }

  const houseTransformsGroup = pipe(
    object,
    findFirstGuardUp(isHouseTransformsGroup),
    someOrError(
      `no HouseTransformsGroup found upwards of: ${JSON.stringify(
        scopeElement,
        null,
        2
      )}`
    )
  )

  const deleteHouse = () => {
    houseTransformsGroup.userData.deleteHouse()
    close()
  }

  const [renaming, setRenaming] = useState(false)

  return (
    <ContextMenu
      {...{
        pageX: x,
        pageY: y,
        onClose: close,
      }}
    >
      <Fragment>
        {!renaming && (
          <ContextMenuButton
            icon={<Pencil />}
            text="Edit building"
            unpaddedSvg
            onClick={() => {
              dispatchModeChange({
                prev: SiteCtxModeEnum.Enum.SITE,
                next: SiteCtxModeEnum.Enum.BUILDING,
              })
              dispatchOutline({
                selectedObjects: [],
              })
              close()
            }}
          />
        )}
        <ContextMenuButton
          icon={<TextCursor />}
          text="Rename"
          unpaddedSvg
          onClick={() => void setRenaming(true)}
        />
        {renaming && (
          <RenameForm
            currentName={houseTransformsGroup.userData.friendlyName}
            onNewName={(friendlyName) => {
              const { houseId } = houseTransformsGroup.userData
              houseTransformsGroup.userData.friendlyName = friendlyName
              userDB.houses.update(houseId, {
                friendlyName,
              })
              setRenaming(false)
            }}
          />
        )}
        {!renaming && (
          <Fragment>
            <ResetContextMenuButton {...{ houseTransformsGroup, close }} />
            <ContextMenuButton
              icon={<TrashCan size={20} />}
              text="Delete"
              onClick={deleteHouse}
            />
          </Fragment>
        )}
        <Exporters houseId={houseTransformsGroup.userData.houseId} />
      </Fragment>
    </ContextMenu>
  )
}

export default SiteModeContextMenu
