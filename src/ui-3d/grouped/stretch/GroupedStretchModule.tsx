import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useModuleElements } from "@/data/elements"
import { Module } from "@/data/modules"
import { HandleSide } from "@/hooks/gestures/drag/handles"
import {
  ColumnLayoutKeyInput,
  getVanillaColumnKey,
  indicesToKey,
} from "@/hooks/layouts"
import { RM, S } from "@/utils/functions"
import GroupedStretchElement from "./GroupedStretchElement"

export type StretchModuleProps = Omit<ColumnLayoutKeyInput, "columnIndex"> & {
  module: Module
  levelY: number
}

const GroupedStretchModule = (props: StretchModuleProps) => {
  const { systemId, houseId, levelIndex, gridGroupIndex, module, levelY } =
    props

  const elements = useModuleElements(module)

  const children = pipe(
    elements,
    RM.collect(S.Ord)((elementName, geometryHash) => {
      return (
        <GroupedStretchElement
          key={`${elementName}`}
          {...{
            module,
            systemId,
            houseId,
            levelIndex,
            gridGroupIndex,
            elementName,
            geometryHash,
            levelY,
          }}
        />
      )
    })
  )

  return <Fragment>{children}</Fragment>
}

export default GroupedStretchModule
