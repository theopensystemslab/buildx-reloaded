import { useModuleElements } from "@/data/elements"
import { Module } from "@/data/modules"
import { indicesToKey, SystemHouseModuleIdentifier } from "@/hooks/layouts"
import { RM, S } from "@/utils/functions"
import { pipe } from "fp-ts/lib/function"
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
    RM.collect(S.Ord)((elementName, geometryHash) => {
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

export default PreviewModule
