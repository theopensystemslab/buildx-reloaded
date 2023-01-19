import { Add } from "@carbon/icons-react"
import { House } from "../../data/house"
import houses, { useHouse } from "../../hooks/houses"
import { LevelTypeOption, useChangeLevelType } from "../../hooks/levels"
import { closeMenu } from "../../hooks/menu"
import { useScope } from "../../hooks/scope"
import { enterBuildingMode } from "../../hooks/siteCtx"
import { Menu, Pencil, TextCursor } from "../icons"
import Radio from "../Radio"
import ChangeLevelType from "./ChangeLevelType"
import ContextMenu, { ContextMenuProps } from "./ContextMenu"
import ContextMenuButton from "./ContextMenuButton"
import ContextMenuNested from "./ContextMenuNested"

const ContextMenuEntry = ({ x: pageX, y: pageY }: { x: number; y: number }) => {
  const { selected } = useScope()

  if (!selected) throw new Error("null selected")

  const props: ContextMenuProps = {
    pageX,
    pageY,
    onClose: closeMenu,
    selected,
  }

  const { houseId } = selected
  const house = useHouse(houseId) as House

  const editBuilding = () => {
    enterBuildingMode(house.id)
    props?.onClose?.()
  }

  // const {
  //   options: levelTypeOptions,
  //   selected: selectedLevelType,
  //   levelString,
  // } = useChangeLevelType({
  //   systemId: house.systemId,
  // })
  // const canChangeLevelType = levelTypeOptions.length > 1
  // const changeLevelType = ({ houseDna }: LevelTypeOption["value"]) => {
  //   houses[houseId].dna = houseDna
  //   props.onClose?.()
  // }

  return (
    <ContextMenu {...props}>
      {/* <ContextMenuHeading>{house.friendlyName}</ContextMenuHeading> */}

      <ContextMenuButton
        icon={<Pencil />}
        text="Edit building"
        unpaddedSvg
        onClick={editBuilding}
      />
      <ContextMenuButton icon={<TextCursor />} text="Rename" unpaddedSvg />
      <ContextMenuButton icon={<Menu />} text="Menu" />
      <ContextMenuButton icon={<Add size={24} />} text="Add" />

      <ChangeLevelType houseId={houseId} />

      {/* {canChangeLevelType && (
        <ContextMenuNested long label={`Change ${levelString} type`}>
          <Radio
            options={levelTypeOptions}
            selected={selectedLevelType}
            onChange={changeLevelType}
          />
        </ContextMenuNested>
      )} */}
    </ContextMenu>
  )
}

export default ContextMenuEntry
