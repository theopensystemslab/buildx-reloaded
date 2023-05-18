import { pipe } from "fp-ts/lib/function"
import { useModuleElements } from "~/data/elements"
import { Module } from "@/server/data/modules"
import {
  indicesToKey,
  SystemHouseModuleIdentifier,
} from "~/design/state/layouts"
import { M, O, pipeLog, R, RM, S } from "~/utils/functions"
import GroupedElement from "./GroupedElement"
import { calculateArea } from "../../../utils/three"
import { hashedGeometries } from "../../state/hashedGeometries"

export type ModuleProps = SystemHouseModuleIdentifier & {
  module: Module
  levelY: number
  moduleZ: number
  startColumn: boolean
  endColumn: boolean
}

const GroupedModule = (props: ModuleProps) => {
  const {
    systemId,
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    module,
    levelY,
    moduleZ,
    startColumn,
    endColumn,
  } = props

  const elements = useModuleElements(module)

  pipe(
    elements,
    M.filterMapWithIndex((k, a) => {
      return pipe(
        hashedGeometries,
        R.lookup(a),
        O.map((geom) => pipe(geom, calculateArea))
      )
    }),
    pipeLog
  )

  const children = pipe(
    elements,
    RM.collect(S.Ord)((elementName, geometryHash) => {
      const key = indicesToKey({
        houseId,
        columnIndex,
        levelIndex,
        gridGroupIndex,
      })

      return (
        <GroupedElement
          key={`${key}:${elementName}`}
          {...{
            module,
            systemId,
            houseId,
            columnIndex,
            levelIndex,
            gridGroupIndex,
            elementName,
            geometryHash,
            levelY,
            moduleZ,
            startColumn,
            endColumn,
          }}
        />
      )
    })
  )

  return (
    <group
      position={[
        0,
        levelY,
        endColumn ? moduleZ + module.length / 2 : moduleZ - module.length / 2,
      ]}
      scale-z={endColumn ? 1 : -1}
    >
      {children}
    </group>
  )
}

export default GroupedModule
