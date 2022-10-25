import { PositionedRow } from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import * as RA from "fp-ts/ReadonlyArray"
import { Plane } from "three"
import GltfModule from "./GltfModule"

type Props = {
  houseId: string
  columnZ: number
  columnIndex: number
  mirror?: boolean
  gridGroups: readonly PositionedRow[]
  verticalCutPlanes: Plane[]
}

const GltfColumn = (props: Props) => {
  const {
    houseId,
    columnIndex,
    columnZ,
    gridGroups,
    mirror = false,
    verticalCutPlanes,
    ...groupProps
  } = props
  const levels = pipe(
    gridGroups,
    RA.map(({ levelIndex, modules, y }) =>
      pipe(
        modules,
        RA.mapWithIndex((groupIndex, { module, z }) => {
          const key = `${houseId}:${columnIndex},${levelIndex},${groupIndex}`
          const position: V3 = [
            0,
            y,
            mirror ? z + module.length / 2 : z - module.length / 2,
          ]
          return (
            <GltfModule
              key={key}
              module={module}
              columnIndex={columnIndex}
              levelIndex={levelIndex}
              levelY={y}
              groupIndex={groupIndex}
              houseId={houseId}
              position={position}
              scale={[1, 1, mirror ? 1 : -1]}
              verticalCutPlanes={verticalCutPlanes}
            />
          )
        })
      )
    )
  )
  return (
    <group position-z={columnZ} {...groupProps}>
      {levels}
    </group>
  )
}
export default GltfColumn
