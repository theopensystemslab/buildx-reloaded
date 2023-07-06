import { Module } from "@/server/data/modules"
import { pipe } from "fp-ts/lib/function"
import { useSpeckleObject } from "~/data/elements"
import { indicesToKey } from "~/design/state/layouts"
import { O, R, S } from "~/utils/functions"
import { SystemHouseModuleIdentifier } from "../../../workers/layouts"
import GroupedElement from "./GroupedElement"

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
    module: { speckleBranchUrl },
    levelY,
    moduleZ,
    startColumn,
    endColumn,
  } = props

  const elements = useSpeckleObject(speckleBranchUrl)

  const children = pipe(
    elements,
    O.getOrElse(() => ({})),
    R.collect(S.Ord)((elementName, geometry) => {
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
            geometry,
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
      name={`${houseId}:${module.dna}`}
    >
      {children}
    </group>
  )
}

export default GroupedModule
