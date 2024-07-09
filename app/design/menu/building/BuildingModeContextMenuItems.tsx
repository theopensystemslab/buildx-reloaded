import {
  ScopeElement,
  SiteCtxMode,
  SiteCtxModeEnum,
} from "@opensystemslab/buildx-core"
import { Fragment } from "react"
import { Pencil } from "~/ui/icons"
import ChangeWindows from "../common/ChangeWindows"
import ContextMenuButton from "../common/ContextMenuButton"

type Props = {
  scopeElement: ScopeElement
  setMode: (mode: SiteCtxMode) => void
  close: () => void
}
const BuildingModeContextMenuItems = ({ scopeElement, setMode }: Props) => {
  const { rowIndex, elementGroup } = scopeElement

  const houseGroup = elementGroup.houseGroup

  return (
    <Fragment>
      <ContextMenuButton
        icon={<Pencil />}
        text="Edit level"
        unpaddedSvg
        onClick={() => {
          setMode(SiteCtxModeEnum.Enum.ROW)
        }}
      />

      {/* <ChangeMaterial
        houseTransformsGroup={houseGroup}
        scopeElement={scopeElement}
        close={close}
      /> */}

      <ChangeWindows scopeElement={scopeElement} close={close} />

      {/* <ChangeLevelType
        close={close}
        houseTransformsGroup={houseGroup}
        scopeElement={scopeElement}
      /> */}

      {/* <AddRemoveLevels
        {...{
          houseId,
          columnIndex,
          levelIndex,
          gridGroupIndex,
          onComplete: props.onClose,
        }}
      /> */}
    </Fragment>
  )
}

export default BuildingModeContextMenuItems
