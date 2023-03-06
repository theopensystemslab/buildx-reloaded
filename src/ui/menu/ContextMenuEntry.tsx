import { invalidate } from "@react-three/fiber"
import { Fragment } from "react"
import { House } from "../../data/house"
import { useHouse } from "../../hooks/houses"
import { closeMenu } from "../../hooks/menu"
import { useScope } from "../../hooks/scope"
import {
  enterBuildingMode,
  SiteCtxMode,
  SiteCtxModeEnum,
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

  const buildingMode = mode === SiteCtxModeEnum.Enum.BUILDING

  const levelMode = mode === SiteCtxModeEnum.Enum.LEVEL

  const buildingOrLevelMode = (
    [SiteCtxModeEnum.Enum.BUILDING, SiteCtxModeEnum.Enum.LEVEL] as SiteCtxMode[]
  ).includes(mode)

  return (
    <ContextMenu {...props}>
      {mode === SiteCtxModeEnum.Enum.SITE && (
        <Fragment>
          <ContextMenuButton
            icon={<Pencil />}
            text="Edit building"
            unpaddedSvg
            onClick={editBuilding}
          />
          <ContextMenuButton icon={<TextCursor />} text="Rename" unpaddedSvg />
          {/* <ContextMenuButton icon={<Menu />} text="Menu" />
      <ContextMenuButton icon={<Add size={24} />} text="Add" /> */}
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
