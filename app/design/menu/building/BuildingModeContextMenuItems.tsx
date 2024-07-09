import { ScopeElement } from "@opensystemslab/buildx-core"
import { Fragment } from "react"
import { Pencil } from "~/ui/icons"
import ChangeWindows from "../common/ChangeWindows"
import ContextMenuButton from "../common/ContextMenuButton"

type Props = {
  scopeElement: ScopeElement
  close: () => void
}
const BuildingModeContextMenuItems = ({ scopeElement }: Props) => {
  const { elementGroup } = scopeElement

  return (
    <Fragment>
      <ContextMenuButton
        icon={<Pencil />}
        text="Edit level"
        unpaddedSvg
        onClick={() => {
          elementGroup.scene.contextManager?.contextDown(elementGroup)
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
