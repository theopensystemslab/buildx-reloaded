import { Reset, TrashCan } from "@carbon/icons-react"
import { invalidate } from "@react-three/fiber"
import { flow, pipe } from "fp-ts/lib/function"
import React, { Fragment, useEffect, useState } from "react"
import { ColumnLayout } from "../../../db/layouts"
import systemsDB from "../../../db/systems"
import userDB from "../../../db/user"
import { Pencil, TextCursor } from "../../../ui/icons"
import { O, someOrError, T, TO } from "../../../utils/functions"
import { setInvisibleNoRaycast } from "../../../utils/three"
import { getLayoutsWorker } from "../../../workers"
import { closeMenu } from "../../state/menu"
import scope from "../../state/scope"
import { downMode, exitBuildingMode } from "../../state/siteCtx"
import { dispatchDeleteHouse } from "../../ui-3d/fresh/events/houses"
import { findFirstGuardUp } from "../../ui-3d/fresh/helpers/sceneQueries"
import { createHouseLayoutGroup } from "../../ui-3d/fresh/scene/houseLayoutGroup"
import { isHouseTransformsGroup } from "../../ui-3d/fresh/scene/userData"
import RenameForm from "../RenameForm"
import ContextMenu from "./common/ContextMenu"
import ContextMenuButton from "./common/ContextMenuButton"
import { ModeContextMenuProps } from "./common/props"
import ResetContextMenuButton from "./interactions/ResetContextMenuButton"

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
    const { houseId } = scopeElement
    houseTransformsGroup.removeFromParent()
    console.log(houseTransformsGroup)
    userDB.houses.delete(houseId)
    scope.selected = null
    exitBuildingMode()
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
            onClick={() => void downMode(scopeElement)}
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
            currentName={""}
            onNewName={(friendlyName) => {
              const { houseId } = houseTransformsGroup.userData
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
      </Fragment>
    </ContextMenu>
  )
}

export default SiteModeContextMenu
