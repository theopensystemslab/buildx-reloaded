import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useModuleElements } from "../../data/elements"
import { Module } from "../../data/modules"
import { ColumnLayoutKeyInput } from "../../hooks/layouts"
import { RM, S } from "../../utils/functions"
import InstancedElement from "./InstancedElement"

export type ModuleProps = ColumnLayoutKeyInput & {
  module: Module
  columnZ: number
  levelY: number
  moduleZ: number
  mirror: boolean
}

const InstancedModule = (props: ModuleProps) => {
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
      <InstancedElement
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

export default InstancedModule
