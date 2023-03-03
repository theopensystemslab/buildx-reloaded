import { pipe } from "fp-ts/lib/function"
import { Fragment, useRef } from "react"
import { Group } from "three"
import { useHouseMaterialOps } from "../../hooks/hashedMaterials"
import { useHouseElementOutline } from "../../hooks/highlights"
import { useHouseSystemId } from "../../hooks/houses"
import { useHouseColumnLayout } from "../../hooks/layouts"
import { useIsMoveRotateable, useIsStretchable } from "../../hooks/siteCtx"
import { useStretchLength } from "../../hooks/transients/stretchLength"
import {
  usePostTransformsTransients,
  usePreTransformsTransients,
} from "../../hooks/transients/transforms"
import { RA } from "../../utils/functions"
import RotateHandles from "../handles/RotateHandles"
import StretchHandle from "../handles/StretchHandle"
import PreviewHouses from "./preview/PreviewHouses"
import GroupedColumn from "./GroupedColumn"
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

  const layout = useHouseColumnLayout(houseId)

  const { startColumn, midColumns, endColumn, columnsUp, columnsDown } =
    useStretchLength({ houseId, layout, startRef, endRef })

  const startColumnRef = useRef<Group>(null)
  const midColumnsRef = useRef<Group>(null)
  const endColumnRef = useRef<Group>(null)
  const houseRefs = [startColumnRef, midColumnsRef, endColumnRef]

  const setHouseVisible = (b: boolean) => {
    for (let ref of houseRefs) {
      if (ref.current) ref.current.visible = b
    }
  }

  usePreTransformsTransients(houseId)
  usePostTransformsTransients(houseId, houseGroupRef)

  useHouseElementOutline(houseId, houseGroupRef)

  const isStretchable = useIsStretchable(houseId)
  const isMoveRotateable = useIsMoveRotateable(houseId)

  useHouseMaterialOps(houseId, houseGroupRef)

  return (
    <Fragment>
      <group ref={houseGroupRef}>
        <group ref={startRef}>
          <StretchHandle
            houseId={houseId}
            axis="z"
            direction={-1}
            disable={!isStretchable}
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
            disable={!isStretchable}
          />
        </group>

        <StretchWidth
          houseId={houseId}
          columnLayout={layout}
          setHouseVisible={setHouseVisible}
        />

        <RotateHandles
          houseId={houseId}
          scale={isMoveRotateable ? [1, 1, 1] : [0, 0, 0]}
        />

        <group scale={isStretchable ? [1, 1, 1] : [0, 0, 0]}>
          {columnsUp}
          {columnsDown}
        </group>

        <PreviewHouses houseId={houseId} setHouseVisible={setHouseVisible} />
      </group>
    </Fragment>
  )
}

export default GroupedHouse
