import { pipe } from "fp-ts/lib/function"
import React, { useRef } from "react"
import { Group } from "three"
import { serializeLayoutsKey } from "../../../db/layouts"
import { House } from "../../../db/user"
import { RA } from "../../../utils/functions"
import { useHouseMaterialOps } from "../../state/hashedMaterials"
import { useDnasLayout } from "../../state/layouts"
import { useTransformabilityBooleans } from "../../state/siteCtx"
import { useStretchLength } from "../../state/transients/stretchLength"
import RotateHandles from "../handles/RotateHandles"
import StretchHandle from "../handles/StretchHandle"
import GroupedColumn from "./GroupedColumn"
import PreviewHouses from "./preview/PreviewHouses"
import StretchWidth from "./stretchWidth/StretchWidth"

type Props = {
  house: House
}

const GroupedHouse2 = (props: Props) => {
  const { house } = props
  const { systemId, id: houseId, dnas, position, rotation } = house

  const layoutsKey = serializeLayoutsKey({ systemId, dnas })

  const rootRef = useRef<Group>(null!)
  const startRef = useRef<Group>(null!)
  const endRef = useRef<Group>(null!)

  const { stretchEnabled, moveRotateEnabled } =
    useTransformabilityBooleans(houseId)

  const layout = useDnasLayout(house)

  const { startColumn, midColumns, endColumn, columnsUp, columnsDown } =
    useStretchLength({ houseId, layout, startRef, endRef })

  useHouseMaterialOps({
    houseId,
    ref: rootRef,
    layoutsKey,
  })

  const startColumnRef = useRef<Group>(null!)
  const midColumnsRef = useRef<Group>(null!)
  const endColumnRef = useRef<Group>(null!)

  const setHouseVisible = (b: boolean) =>
    [startColumnRef, midColumnsRef, endColumnRef].forEach((ref) => {
      ref.current.visible = b
    })

  return (
    <group ref={rootRef}>
      <group ref={startRef}>
        <StretchHandle
          houseId={houseId}
          axis="z"
          direction={-1}
          disable={!stretchEnabled}
        />
        <GroupedColumn
          ref={startColumnRef}
          key={`${houseId}:${startColumn.columnIndex}`}
          column={startColumn}
          {...{ systemId, houseId, start: true }}
        />
      </group>
      <group ref={midColumnsRef}>
        {pipe(
          midColumns,
          RA.map((column) => (
            <GroupedColumn
              key={`${houseId}:${column.columnIndex}`}
              column={column}
              {...{ systemId, houseId }}
            />
          ))
        )}
      </group>
      <group ref={endRef}>
        <GroupedColumn
          ref={endColumnRef}
          key={`${houseId}:${endColumn.columnIndex}`}
          column={endColumn}
          {...{ systemId, houseId, end: true }}
        />
        <StretchHandle
          houseId={houseId}
          axis="z"
          direction={1}
          disable={!stretchEnabled}
        />
      </group>

      <StretchWidth
        houseId={houseId}
        columnLayout={layout}
        setHouseVisible={setHouseVisible}
      />

      <RotateHandles
        houseId={houseId}
        scale={moveRotateEnabled ? [1, 1, 1] : [0, 0, 0]}
      />

      <group scale={stretchEnabled ? [1, 1, 1] : [0, 0, 0]}>
        {columnsUp}
        {columnsDown}
      </group>
      <PreviewHouses houseId={houseId} setHouseVisible={setHouseVisible} />
    </group>
  )
}

export default GroupedHouse2
