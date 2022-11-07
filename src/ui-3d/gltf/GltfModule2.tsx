import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { Module } from "../../data/modules"
import { useModuleElementGeometries } from "../../hooks/geometries"
import instances, { useUpsertInstance } from "../../hooks/instances"
import { ColumnLayoutKeyInput } from "../../hooks/layouts"
import { O, RA, RM, S } from "../../utils/functions"

type Props = ColumnLayoutKeyInput & {
  houseId: string
  module: Module
  columnZ: number
  levelY: number
  moduleZ: number
}

const GltfModule2 = (props: Props) => {
  const {
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    module,
    columnZ,
    levelY,
    moduleZ,
  } = props
  const { systemId, dna } = module

  const elementMap = useModuleElementGeometries(systemId, dna)

  const upsertInstance = useUpsertInstance(houseId)

  const end = () => <Fragment />

  pipe(
    O.fromNullable(elementMap),
    O.match(end, (elementMap) =>
      pipe(
        elementMap,
        RM.keys(S.Ord),
        RA.map((elementName) => {
          upsertInstance({
            systemId,
            houseId,
            columnIndex,
            levelIndex,
            gridGroupIndex,
            position: [0, levelY, columnZ + moduleZ],
            rotation: 0,
            dna,
            elementName,
          })
        }),
        end
      )
    )
  )

  return <Fragment />
}

export default GltfModule2
