import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useModuleElements } from "../../data/elements"
import { Module } from "../../data/modules"
import { ColumnLayoutKeyInput, indicesToKey } from "../../hooks/layouts"
import { RM, S } from "../../utils/functions"
import DefaultElement from "./DefaultElement"

export type ModuleProps = ColumnLayoutKeyInput & {
  module: Module
  columnZ: number
  levelY: number
  moduleZ: number
  startColumn: boolean
  endColumn: boolean
}

const DefaultModule = (props: ModuleProps) => {
  const {
    systemId,
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    module,
    columnZ,
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
        systemId,
        houseId,
        columnIndex,
        levelIndex,
        gridGroupIndex,
      })

      return (
        <DefaultElement
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
            columnZ,
            levelY,
            moduleZ,
            startColumn,
            endColumn,
          }}
        />
      )
    })
  )

  return <Fragment>{children}</Fragment>
}

export default DefaultModule
