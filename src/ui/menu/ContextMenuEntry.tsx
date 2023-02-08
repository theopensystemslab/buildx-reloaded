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
import ChangeLevelType from "./ChangeLevelType"
import ChangeMaterials from "./ChangeMaterials"
import ChangeWindows from "./ChangeWindows"
import ContextMenu, { ContextMenuProps } from "./ContextMenu"
import ContextMenuButton from "./ContextMenuButton"

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

      {mode === SiteCtxModeEnum.Enum.BUILDING && (
        <Fragment>
          <ChangeLevelType houseId={houseId} onChange={props.onClose} />
        </Fragment>
      )}

      {(
        [
          SiteCtxModeEnum.Enum.BUILDING,
          SiteCtxModeEnum.Enum.LEVEL,
        ] as SiteCtxMode[]
      ).includes(mode) && (
        <Fragment>
          <ChangeMaterials
            houseId={houseId}
            elementName={elementName}
            onComplete={props.onClose}
          />
        </Fragment>
      )}

      <ChangeWindows
        {...{
          houseId,
          columnIndex,
          levelIndex,
          gridGroupIndex,
          onComplete: props.onClose,
        }}
      />
    </ContextMenu>
  )
}

export default ContextMenuEntry
