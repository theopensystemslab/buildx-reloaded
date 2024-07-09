import { TrashCan } from "@carbon/icons-react"
import { invalidate } from "@react-three/fiber"
import { Fragment, useState } from "react"
import userDB from "../../../db/user"
import { Pencil, TextCursor } from "../../../ui/icons"
import { closeMenu } from "../../state/menu"
import RenameForm from "../../ui/RenameForm"
import ContextMenuButton from "../common/ContextMenuButton"
import {
  ScopeElement,
  SiteCtxMode,
  SiteCtxModeEnum,
} from "@opensystemslab/buildx-core"

type Props = {
  scopeElement: ScopeElement
  setMode: (mode: SiteCtxMode) => void
  close: () => void
}

const SiteModeContextMenuItems = ({ scopeElement, setMode, close }: Props) => {
  const { elementGroup } = scopeElement

  const houseGroup = elementGroup.houseGroup

  const deleteHouse = () => {
    houseGroup.delete()
    close()
  }

  const [renaming, setRenaming] = useState(false)

  return (
    <Fragment>
      {!renaming && (
        <ContextMenuButton
          icon={<Pencil />}
          text="Edit building"
          unpaddedSvg
          onClick={() => {
            houseGroup.editHouse()
            setMode(SiteCtxModeEnum.Enum.BUILDING)
            // dispatchModeChange({
            //   prev: SiteCtxModeEnum.Enum.SITE,
            //   next: SiteCtxModeEnum.Enum.BUILDING,
            // })
            // dispatchOutline({
            //   selectedObjects: [],
            // })
            // close()
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
            houseGroup.friendlyName = friendlyName
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
  )
}

export default SiteModeContextMenuItems
