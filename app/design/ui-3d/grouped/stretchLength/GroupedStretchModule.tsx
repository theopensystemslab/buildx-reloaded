import { Module } from "@/server/data/modules"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useModuleElements } from "~/data/elements"
import { SystemHouseModuleIdentifier } from "~/design/state/layouts"
import { R, S } from "~/utils/functions"
import GroupedStretchElement from "./GroupedStretchElement"

export type StretchModuleProps = Omit<
  SystemHouseModuleIdentifier,
  "columnIndex"
> & {
  module: Module
  levelY: number
}

const GroupedStretchModule = (props: StretchModuleProps) => {
  const { systemId, houseId, levelIndex, gridGroupIndex, module, levelY } =
    props

  const elements = useModuleElements(module)

  const children = pipe(
    elements,
    R.collect(S.Ord)((elementName, geometry) => {
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
            geometry,
            levelY,
          }}
        />
      )
    })
  )

  return <Fragment>{children}</Fragment>
}

export default GroupedStretchModule
