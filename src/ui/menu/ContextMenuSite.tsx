import ContextMenu, { ContextMenuProps } from "./ContextMenu"
import ContextMenuButton from "./ContextMenuButton"
import ContextMenuHeading from "./ContextMenuHeading"
// import { useSystemsData } from "@/contexts/SystemsData"
import { House } from "@/data/house"
import siteContext, {
  EditModeEnum,
  enterBuildingMode,
  exitBuildingMode,
} from "@/hooks/siteCtx"
// import { exportGLB } from "@/hooks/events"
import houses, { useHouse } from "@/hooks/houses"
import scope from "@/hooks/scope"
import { Fragment, useState } from "react"
import { useAllHouseTypes } from "../../data/houseType"
// import RenameForm from "./RenameForm"

const ContextMenuSite = (props: ContextMenuProps) => {
  const { selected } = props

  const { houseId } = selected

  const house = useHouse(houseId) as House

  const { data: houseTypes } = useAllHouseTypes()

  const resetBuilding = () => {
    const houseType = houseTypes?.find((ht) => ht.id === house.houseTypeId)
    if (houseType) {
      houses[houseId].dna = houseType.dna as string[]
      houses[houseId].modifiedMaterials = {}
      houses[houseId].rotation = 0
    }
    props.onClose?.()
  }

  const deleteBuilding = () => {
    delete houses[houseId]
    scope.selected = null
    if (Object.keys(houses).length === 0) {
      exitBuildingMode()
    }
    props.onClose?.()
  }

  const [renaming, setRenaming] = useState(false)

  const rename = () => setRenaming(true)

  const editBuilding = () => {
    enterBuildingMode(house.id)
    props?.onClose?.()
  }

  const moveRotate = () => {
    siteContext.editMode = EditModeEnum.Enum.MOVE_ROTATE
    props.onClose?.()
  }

  return (
    <ContextMenu {...props}>
      <ContextMenuHeading>{house.friendlyName}</ContextMenuHeading>
      {!renaming && (
        <Fragment>
          <ContextMenuButton onClick={editBuilding}>
            {`Edit building`}
          </ContextMenuButton>
          <ContextMenuButton onClick={moveRotate}>
            {`Move/rotate building`}
          </ContextMenuButton>
        </Fragment>
      )}

      <Fragment>
        <ContextMenuButton onClick={rename} className="focus:outline-none">
          {`Rename building`}
        </ContextMenuButton>
        {/* {renaming && (
          <RenameForm
            {...props}
            currentName={house.friendlyName}
            onNewName={(newName) => {
              houses[houseId].friendlyName = newName
              setRenaming(false)
            }}
          />
        )} */}
      </Fragment>

      {!renaming && (
        <Fragment>
          <ContextMenuButton onClick={resetBuilding}>
            {`Reset building`}
          </ContextMenuButton>
          <ContextMenuButton onClick={deleteBuilding}>
            {`Delete building`}
          </ContextMenuButton>
        </Fragment>
      )}

      {/* <ContextMenuButton onClick={() => void exportGLB(houseId)}>
        Export GLB
      </ContextMenuButton> */}
    </ContextMenu>
  )
}

export default ContextMenuSite
