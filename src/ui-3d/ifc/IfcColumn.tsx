import { PositionedRow } from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import * as RA from "fp-ts/ReadonlyArray"
import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Plane } from "three"

const IfcModule = dynamic(() => import("./IfcModule"), { ssr: false })

type Props = {
  houseId: string
  columnZ: number
  columnIndex: number
  mirror?: boolean
  gridGroups: readonly PositionedRow[]
  verticalCutPlanes: Plane[]
}

const IfcColumn = (props: Props) => {
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
          const key = `${houseId}:${columnIndex}-${levelIndex}-${groupIndex}`
          const position: V3 = [
            0,
            y,
            mirror ? z + module.length / 2 : z - module.length / 2,
          ]
          return (
            <Suspense key={key} fallback={null}>
              <IfcModule
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
            </Suspense>
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
export default IfcColumn