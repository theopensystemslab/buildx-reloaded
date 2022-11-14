import { PositionedRow } from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import * as RA from "fp-ts/ReadonlyArray"
import { Plane } from "three"
import BoxModule from "./BoxModule"

type Props = {
  houseId: string
  columnZ: number
  columnIndex: number
  mirror?: boolean
  gridGroups: readonly PositionedRow[]
  verticalCutPlanes: Plane[]
}

const BoxColumn = (props: Props) => {
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

          return (
            <BoxModule
              key={key}
              module={module}
              columnIndex={columnIndex}
              levelIndex={levelIndex}
              levelY={y}
              groupIndex={groupIndex}
              houseId={houseId}
              position={[
                0,
                y,
                mirror ? z + module.length / 2 : z - module.length / 2,
              ]}
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
export default BoxColumn
