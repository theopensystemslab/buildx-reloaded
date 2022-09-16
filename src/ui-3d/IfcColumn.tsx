import { PositionedRow } from "@/hooks/layouts"
import { Plane } from "three"
import * as RA from "fp-ts/ReadonlyArray"
import { pipe } from "fp-ts/lib/function"
import dynamic from "next/dynamic"
import { Suspense } from "react"

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
  } = props
  const levels = pipe(
    gridGroups,
    RA.map(({ levelIndex, modules, y }) =>
      pipe(
        modules,
        RA.mapWithIndex((groupIndex, { module, z }) => {
          const key = `${columnIndex}-${levelIndex}-${groupIndex}`
          return (
            <Suspense key={key} fallback={null}>
              <IfcModule
                module={module}
                columnIndex={columnIndex}
                levelIndex={levelIndex}
                levelY={y}
                groupIndex={groupIndex}
                houseId={houseId}
                position={[
                  0,
                  y,
                  mirror
                    ? z + module.length / 2
                    : z - module.length + module.length / 2,
                ]}
                scale={[1, 1, mirror ? 1 : -1]}
                verticalCutPlanes={verticalCutPlanes}
              />
            </Suspense>
          )
        })
      )
    )
  )
  return <group position-z={columnZ}>{levels}</group>
}
export default IfcColumn
