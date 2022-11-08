import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useModuleElements } from "../../data/elements"
import { Module } from "../../data/modules"
import { ColumnLayoutKeyInput } from "../../hooks/layouts"
import { RM, S } from "../../utils/functions"
import DefaultElement from "./DefaultElement"

export type ModuleProps = ColumnLayoutKeyInput & {
  module: Module
  columnZ: number
  levelY: number
  moduleZ: number
  mirror: boolean
}

const DefaultModule = (props: ModuleProps) => {
  const {
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    module,
    columnZ,
    levelY,
    moduleZ,
    mirror,
  } = props
  const { systemId } = module

  const elements = useModuleElements(module)

  const children = pipe(
    elements,
    RM.collect(S.Ord)((elementName, geometryHash) => (
      <DefaultElement
        key={elementName}
        {...{
          module,
          systemId,
          houseId,
          columnIndex,
          levelIndex,
          gridGroupIndex,
          columnZ,
          levelY,
          moduleZ,
          elementName,
          geometryHash,
          mirror,
        }}
      />
    ))
  )

  return <Fragment>{children}</Fragment>
}

export default DefaultModule
