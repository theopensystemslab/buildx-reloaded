import { Add } from "@carbon/icons-react"
import { House } from "../../data/house"
import { useHouse } from "../../hooks/houses"
import { closeMenu } from "../../hooks/menu"
import { useScope } from "../../hooks/scope"
import { enterBuildingMode } from "../../hooks/siteCtx"
import { Menu, Pencil, TextCursor } from "../icons"
import ContextMenu, { ContextMenuProps } from "./ContextMenu"
import ContextMenuButton from "./ContextMenuButton"

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
  // } = useLevelTypeOptions(house.id, columnLayout, {
  //   columnIndex,
  //   levelIndex,
  //   groupIndex,
  // })

  // const canChangeLevelType = levelTypeOptions.length > 1

  // const changeLevelType = ({ buildingDna }: LevelTypeOpt["value"]) => {
  //   houses[buildingId].dna = buildingDna
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
    </ContextMenu>
  )
}

export default ContextMenuEntry
