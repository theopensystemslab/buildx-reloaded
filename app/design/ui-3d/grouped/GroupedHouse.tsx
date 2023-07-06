import { pipe } from "fp-ts/lib/function"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { Group } from "three"
import { useHouseMaterialOps } from "~/design/state/hashedMaterials"
import { useHouseElementOutline } from "~/design/state/highlights"
import { useDnasLayout } from "~/design/state/layouts"
import { useStretchLength } from "~/design/state/transients/stretchLength"
import {
  usePostTransformsTransients,
  usePreTransformsTransients,
} from "~/design/state/transients/transforms"
import { RA } from "~/utils/functions"
import { serializeLayoutKey } from "../../../db/layouts"
import { useHouse, useHouseSystemId } from "../../state/houses"
import { useTransformabilityBooleans } from "../../state/siteCtx"
import RotateHandles from "../handles/RotateHandles"
import StretchHandle from "../handles/StretchHandle"
import GroupedColumn from "./GroupedColumn"
import PreviewHouses from "./preview/PreviewHouses"
import StretchWidth from "./stretchWidth/StretchWidth"

type Props = {
  houseId: string
}

const GroupedHouse = (props: Props) => {
  const { houseId } = props

  const houseGroupRef = useRef<Group>(null!)
  const startRef = useRef<Group>(null!)
  const endRef = useRef<Group>(null!)

  const systemId = useHouseSystemId(houseId)
  const house = useHouse(houseId)
  const houseDnasKey = JSON.stringify(house.dnas)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dnas = useMemo(() => house.dnas, [houseDnasKey])

  const layout = useDnasLayout({ systemId, dnas })

  const { startColumn, midColumns, endColumn, columnsUp, columnsDown } =
    useStretchLength({ houseId, layout, startRef, endRef })

  const startColumnRef = useRef<Group>(null)
  const midColumnsRef = useRef<Group>(null)
  const endColumnRef = useRef<Group>(null)

  const houseRefs = useMemo(
    () => [startColumnRef, midColumnsRef, endColumnRef],
    []
  )

  const setHouseVisible = useCallback(
    (b: boolean) => {
      for (let ref of houseRefs) {
        if (ref.current) ref.current.visible = b
      }
    },
    [houseRefs]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setHouseVisible(true), [dnas, setHouseVisible])

  usePreTransformsTransients(houseId)
  usePostTransformsTransients(houseId, houseGroupRef)

  useHouseElementOutline(houseId, houseGroupRef)

  const { stretchEnabled, moveRotateEnabled } =
    useTransformabilityBooleans(houseId)

  useHouseMaterialOps({
    houseId,
    ref: houseGroupRef,
    layoutsKey: serializeLayoutKey({ systemId, dnas }),
  })

  return (
    <group ref={houseGroupRef} key={houseDnasKey}>
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

export default GroupedHouse
