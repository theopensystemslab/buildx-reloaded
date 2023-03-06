import { invalidate } from "@react-three/fiber"
import { Fragment, useState } from "react"
import { House } from "../../data/house"
import houses, { useHouse } from "../../hooks/houses"
import { closeMenu } from "../../hooks/menu"
import scope, { useScope } from "../../hooks/scope"
import {
  enterBuildingMode,
  exitBuildingMode,
  SiteCtxMode,
  SiteCtxModeEnum,
  getModeBools,
  useSiteCtx,
} from "../../hooks/siteCtx"
import { Pencil, TextCursor } from "../icons"
import AddRemoveLevels from "./interactions/AddRemoveLevels"
import ChangeLayouts from "./interactions/ChangeLayouts"
import ChangeLevelType from "./interactions/ChangeLevelType"
import ChangeMaterials from "./interactions/ChangeMaterials"
import ChangeWindows from "./interactions/ChangeWindows"
import ContextMenu, { ContextMenuProps } from "./common/ContextMenu"
import ContextMenuButton from "./common/ContextMenuButton"
import { Reset, TrashCan } from "@carbon/icons-react"
import { useAllHouseTypes } from "../../data/houseType"
import RenameForm from "../RenameForm"

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
    selected,
  }

  const { houseId, columnIndex, levelIndex, gridGroupIndex, elementName } =
    selected

  const house = useHouse(houseId) as House

  const editBuilding = () => {
    enterBuildingMode(house.id)
    props?.onClose?.()
  }

  const { siteMode, buildingMode, levelMode, buildingOrLevelMode } =
    getModeBools(mode)

  const { data: houseTypes = [] } = useAllHouseTypes()

  const resetBuilding = () => {
    const houseType = houseTypes.find((ht) => ht.id === house.houseTypeId)
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

      {buildingOrLevelMode && (
        <Fragment>
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

      {levelMode && (
        <ChangeLayouts
          {...{
            houseId,
            columnIndex,
            levelIndex,
            gridGroupIndex,
            onComplete: props.onClose,
          }}
        />
      )}
    </ContextMenu>
  )
}

export default ContextMenuEntry
