import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useModuleElements } from "../../data/elements"
import { Module } from "../../data/modules"
import {
  ColumnLayoutKeyInput,
  getVanillaColumnKey,
  indicesToKey,
} from "../../hooks/layouts"
import { RM, S } from "../../utils/functions"
import StretchInstanceElement from "./StretchInstanceElement"

export type StretchModuleProps = Omit<ColumnLayoutKeyInput, "columnIndex"> & {
  module: Module
  columnZ: number
  levelY: number
}

const StretchInstanceModule = (props: StretchModuleProps) => {
  const {
    systemId,
    houseId,
    levelIndex,
    gridGroupIndex,
    module,
    columnZ,
    levelY,
  } = props

  const elements = useModuleElements(module)

  const children = pipe(
    elements,
    RM.collect(S.Ord)((elementName, geometryHash) => {
      const key = getVanillaColumnKey({
        systemId,
        houseId,
        levelIndex,
        gridGroupIndex,
        columnZ,
      })
      return (
        <StretchInstanceElement
          key={`${key}:${elementName}`}
          {...{
            module,
            systemId,
            houseId,
            levelIndex,
            gridGroupIndex,
            elementName,
            geometryHash,
            columnZ,
            levelY,
          }}
        />
      )
    })
  )

  return <Fragment>{children}</Fragment>
}

export default StretchInstanceModule
