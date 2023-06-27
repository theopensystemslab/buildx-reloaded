import { Module } from "@/server/data/modules"
import { pipe } from "fp-ts/lib/function"
import { useModuleElements } from "~/data/elements"
import {
  indicesToKey,
  SystemHouseModuleIdentifier,
} from "~/design/state/layouts"
import { R, S } from "~/utils/functions"
import PreviewElement from "./PreviewElement"

export type PreviewModuleProps = SystemHouseModuleIdentifier & {
  module: Module
  levelY: number
  moduleZ: number
  startColumn: boolean
  endColumn: boolean
}

const PreviewModule = (props: PreviewModuleProps) => {
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

  const children = pipe(
    elements,
    R.collect(S.Ord)((elementName, geometry) => {
      const key = indicesToKey({
        houseId,
        columnIndex,
        levelIndex,
        gridGroupIndex,
      })

      return (
        <PreviewElement
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
    >
      {children}
    </group>
  )
}

export default PreviewModule
