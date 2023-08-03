import { Reset, TrashCan } from "@carbon/icons-react"
import { invalidate } from "@react-three/fiber"
import { Fragment, useState } from "react"
import { useHouseTypes } from "~/data/houseTypes"
import scope, { useScope } from "~/design/state/scope"
import { Pencil, TextCursor } from "~/ui/icons"
import houses, { useHouse } from "../../state/houses"
import { closeMenu } from "../../state/menu"
import {
  downMode,
  exitBuildingMode,
  getModeBools,
  useSiteCtx,
} from "../../state/siteCtx"
import { dispatchDeleteHouse } from "../../ui-3d/fresh/events/houses"
import RenameForm from "../../ui/RenameForm"
import ContextMenu, { ContextMenuProps } from "./ContextMenu"
import ContextMenuButton from "./ContextMenuButton"
import AddRemoveLevels from "./interactions/AddRemoveLevels"
import ChangeLayouts from "./interactions/ChangeLayouts"
import ChangeLevelType from "./interactions/ChangeLevelType"
import ChangeMaterials from "./interactions/ChangeMaterials"
import ChangeWindows from "./interactions/ChangeWindows"
import Exporters from "./interactions/Exporters"

const ContextMenuEntry = ({ x: pageX, y: pageY }: { x: number; y: number }) => {
  const { mode } = useSiteCtx()
  const { selected } = useScope()

  if (!selected) throw new Error("null selected")

  const props: ContextMenuProps = {
    pageX,
    pageY,
    onClose: () => {
      closeMenu()
      invalidate()
    },
  }

  const {
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    ifcTag: elementName,
  } = selected

  const house = useHouse(houseId)

  const editBuilding = () => {
    downMode(selected)
    props.onClose?.()
  }

  const editLevel = () => {
    downMode(selected)
    props.onClose?.()
  }

  const { siteMode, buildingMode, levelMode, buildingOrLevelMode } =
    getModeBools(mode)

  const houseTypes = useHouseTypes()

  const resetBuilding = () => {
    const houseType = houseTypes.find((ht) => ht.id === house.houseTypeId)
    if (houseType) {
      houses[houseId].dnas = houseType.dnas as string[]
      houses[houseId].modifiedMaterials = {}
      houses[houseId].rotation = 0
    }
    props.onClose?.()
  }

  const deleteBuilding = () => {
    dispatchDeleteHouse({
      houseId,
    })
    // delete houses[houseId]
    scope.selected = null

    if (Object.keys(houses).length === 0) {
      exitBuildingMode()
    }
    props.onClose?.()
  }

  const [renaming, setRenaming] = useState(false)

  return (
    <ContextMenu {...props}>
      {siteMode && (
        <Fragment>
          {!renaming && (
            <ContextMenuButton
              icon={<Pencil />}
              text="Edit building"
              unpaddedSvg
              onClick={editBuilding}
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
              {...props}
              currentName={house.friendlyName}
              onNewName={(newName) => {
                houses[houseId].friendlyName = newName
                setRenaming(false)
              }}
            />
          )}
          {!renaming && (
            <Fragment>
              <ContextMenuButton
                icon={<Reset size={20} />}
                text="Reset"
                onClick={resetBuilding}
              />
              <ContextMenuButton
                icon={<TrashCan size={20} />}
                text="Delete"
                onClick={deleteBuilding}
              />
            </Fragment>
          )}
        </Fragment>
      )}

      {buildingMode && (
        <Fragment>
          <ContextMenuButton
            icon={<Pencil />}
            text="Edit level"
            unpaddedSvg
            onClick={editLevel}
          />
          <ChangeMaterials
            houseId={houseId}
            elementName={elementName}
            onComplete={props.onClose}
          />

          <ChangeWindows
            {...{
              houseId,
              columnIndex,
              levelIndex,
              gridGroupIndex,
              onComplete: props.onClose,
            }}
          />
          <ChangeLevelType houseId={houseId} onChange={props.onClose} />
          <AddRemoveLevels
            {...{
              houseId,
              columnIndex,
              levelIndex,
              gridGroupIndex,
              onComplete: props.onClose,
            }}
          />
        </Fragment>
      )}

      {levelMode && (
        <Fragment>
          <ChangeLayouts
            {...{
              houseId,
              columnIndex,
              levelIndex,
              gridGroupIndex,
              onComplete: props.onClose,
            }}
          />
          <ChangeMaterials
            houseId={houseId}
            elementName={elementName}
            onComplete={props.onClose}
          />
          <ChangeWindows
            {...{
              houseId,
              columnIndex,
              levelIndex,
              gridGroupIndex,
              onComplete: props.onClose,
            }}
          />
        </Fragment>
      )}

      <Exporters houseId={houseId} />
    </ContextMenu>
  )
}

export default ContextMenuEntry
