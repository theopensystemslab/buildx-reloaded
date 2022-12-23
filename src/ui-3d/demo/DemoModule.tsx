import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useModuleElements } from "../../data/elements"
import { Module } from "../../data/modules"
import { ColumnLayoutKeyInput, indicesToKey } from "../../hooks/layouts"
import { RM, S } from "../../utils/functions"
import DemoElement from "./DemoElement"

export type ModuleProps = ColumnLayoutKeyInput & {
  module: Module
  columnZ: number
  levelY: number
  moduleZ: number
  start: boolean
  end: boolean
}

const DemoModule = (props: ModuleProps) => {
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
    start,
    end,
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
        <DemoElement
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
            start,
            end,
          }}
        />
      )
    })
  )

  return <Fragment>{children}</Fragment>
}

export default DemoModule
