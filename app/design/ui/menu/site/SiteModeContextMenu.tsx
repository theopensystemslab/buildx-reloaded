import { TrashCan } from "@carbon/icons-react"
import { invalidate } from "@react-three/fiber"
import { Fragment, useState } from "react"
import userDB from "../../../../db/user"
import { Pencil, TextCursor } from "../../../../ui/icons"
import { closeMenu } from "../../../state/menu"
import { dispatchOutline } from "../../../ui-3d/fresh/events/outlines"
import RenameForm from "../../RenameForm"
import ContextMenu from "../common/ContextMenu"
import ContextMenuButton from "../common/ContextMenuButton"
import { ModeContextMenuProps } from "../common/props"
import { O } from "~/utils/functions"

const SiteModeContextMenu = ({ x, y, scopeElement }: ModeContextMenuProps) => {
  const { elementGroup } = scopeElement

  const close = () => {
    closeMenu()
    invalidate()
  }

  const houseGroup = elementGroup.houseGroup

  const deleteHouse = () => {
    houseGroup.delete()
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
              houseGroup.editHouse()
              // dispatchModeChange({
              //   prev: SiteCtxModeEnum.Enum.SITE,
              //   next: SiteCtxModeEnum.Enum.BUILDING,
              // })
              // dispatchOutline({
              //   selectedObjects: [],
              // })
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
            currentName={houseGroup.userData.friendlyName}
            onNewName={(friendlyName) => {
              const { houseId } = houseGroup.userData
              houseGroup.userData.friendlyName = friendlyName
              userDB.houses.update(houseId, {
                friendlyName,
              })
              setRenaming(false)
            }}
          />
        )}
        {!renaming && (
          <Fragment>
            {/* <ResetContextMenuButton
              {...{ houseTransformsGroup: houseGroup, close }}
            /> */}
            <ContextMenuButton
              icon={<TrashCan size={20} />}
              text="Delete"
              onClick={deleteHouse}
            />
          </Fragment>
        )}
        {/* <Exporters houseId={houseGroup.userData.houseId} close={close} /> */}
      </Fragment>
    </ContextMenu>
  )
}

export default SiteModeContextMenu
