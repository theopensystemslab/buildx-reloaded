import { Module } from "@/server/data/modules"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useSpeckleObject } from "~/data/elements"
import { O, R, S } from "~/utils/functions"
import { SystemHouseModuleIdentifier } from "../../../../workers/layouts"
import GroupedStretchElement from "./GroupedStretchElement"

export type StretchModuleProps = Omit<
  SystemHouseModuleIdentifier,
  "columnIndex"
> & {
  module: Module
  levelY: number
}

const GroupedStretchModule = (props: StretchModuleProps) => {
  const {
    systemId,
    houseId,
    levelIndex,
    gridGroupIndex,
    module,
    module: { speckleBranchUrl },
    levelY,
  } = props

  const elements = useSpeckleObject(speckleBranchUrl)

  const children = pipe(
    elements,
    O.getOrElse(() => ({})),
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
