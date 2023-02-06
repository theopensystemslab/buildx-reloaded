import { Fragment } from "react"
import { House } from "../../data/house"
import { useHouse } from "../../hooks/houses"
import { closeMenu } from "../../hooks/menu"
import { useScope } from "../../hooks/scope"
import {
  enterBuildingMode,
  SiteCtxModeEnum,
  useSiteCtx,
} from "../../hooks/siteCtx"
import { Pencil, TextCursor } from "../icons"
import ChangeLevelType from "./ChangeLevelType"
import ChangeMaterials from "./ChangeMaterials"
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
    },
    selected,
  }

  const { houseId, elementName } = selected
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
          <ChangeMaterials
            houseId={houseId}
            elementName={elementName}
            onComplete={props.onClose}
          />
        </Fragment>
      )}
    </ContextMenu>
  )
}

export default ContextMenuEntry
