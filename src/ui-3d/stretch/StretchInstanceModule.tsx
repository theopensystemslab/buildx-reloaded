import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useModuleElements } from "../../data/elements"
import { Module } from "../../data/modules"
import { HandleSide } from "../../hooks/gestures/drag/handles"
import {
  ColumnLayoutKeyInput,
  getVanillaColumnKey,
  indicesToKey,
} from "../../hooks/layouts"
import { RM, S } from "../../utils/functions"
import StretchInstanceElement from "./StretchInstanceElement"

export type StretchModuleProps = Omit<ColumnLayoutKeyInput, "columnIndex"> & {
  module: Module
  levelY: number
  side: HandleSide
}

const StretchInstanceModule = (props: StretchModuleProps) => {
  const {
    systemId,
    houseId,
    levelIndex,
    gridGroupIndex,
    module,
    levelY,
    side,
  } = props

  const elements = useModuleElements(module)

  const children = pipe(
    elements,
    RM.collect(S.Ord)((elementName, geometryHash) => {
      return (
        <StretchInstanceElement
          key={`${side}:${elementName}`}
          {...{
            module,
            systemId,
            houseId,
            levelIndex,
            gridGroupIndex,
            elementName,
            geometryHash,
            levelY,
            side,
          }}
        />
      )
    })
  )

  return <Fragment>{children}</Fragment>
}

export default StretchInstanceModule
