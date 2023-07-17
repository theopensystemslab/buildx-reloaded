import React, { Fragment, useMemo, useState } from "react"
import { Pencil, TextCursor } from "../../../ui/icons"
import { ScopeItem } from "../../state/scope"
import siteCtx, { downMode, getModeBools } from "../../state/siteCtx"
import RenameForm from "../RenameForm"
import ContextMenu from "./ContextMenu"
import ContextMenuButton from "./ContextMenuButton"

const FreshContextMenu = () => {
  const [item, setItem] = useState<ScopeItem | null>(null)
  const [{ pageX, pageY }, setPageXY] = useState({ pageX: 0, pageY: 0 })

  const { buildingMode, buildingOrLevelMode, levelMode, siteMode } =
    useMemo(() => {
      const modeBools = getModeBools(siteCtx.mode)
      return {
        ...modeBools,
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item])

  const editBuilding = () => {
    if (!item) return
    downMode(item)
    // close()
  }

  return (
    <ContextMenu {...{ pageX, pageY }}>
      {siteMode && (
        <Fragment>
          {/* {!renaming && (
            <ContextMenuButton
              icon={<Pencil />}
              text="Edit building"
              unpaddedSvg
              onClick={editBuilding}
            />
          )} */}
          {/* <ContextMenuButton
            icon={<TextCursor />}
            text="Rename"
            unpaddedSvg
            onClick={() => void setRenaming(true)}
          /> */}
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
          {/* {!renaming && (
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
          )} */}
        </Fragment>
      )}

      {/* {buildingMode && (
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
      )} */}

      {/* {levelMode && (
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
      )} */}

      {/* <Exporters houseId={houseId} /> */}
    </ContextMenu>
  )
}

export default FreshContextMenu
