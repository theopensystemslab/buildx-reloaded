import { Module } from "@/server/data/modules"
import { pipe } from "fp-ts/lib/function"
import { useSpeckleObject } from "~/data/elements"
import { indicesToKey } from "~/design/state/layouts"
import { O, R, S } from "~/utils/functions"
import { SystemHouseModuleIdentifier } from "../../../../db/layouts"
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
    module: { speckleBranchUrl },
    levelY,
    moduleZ,
    startColumn,
    endColumn,
  } = props

  const elements = useSpeckleObject(speckleBranchUrl)

  const children = pipe(
    elements,
    O.getOrElse(() => ({})),
    R.collect(S.Ord)((elementName, geometry) => {
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
            geometry,
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
    >
      {children}
    </group>
  )
}

export default PreviewModule
