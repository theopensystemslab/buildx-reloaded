import { TrashCan } from "@carbon/icons-react"
import { ScopeElement } from "@opensystemslab/buildx-core"
import { Fragment, useState } from "react"
import { Pencil, TextCursor } from "../../../ui/icons"
import RenameForm from "../../ui/RenameForm"
import ContextMenuButton from "../common/ContextMenuButton"

type Props = {
  scopeElement: ScopeElement
  close: () => void
}

const SiteModeContextMenuItems = ({ scopeElement, close }: Props) => {
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
