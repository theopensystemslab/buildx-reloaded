import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useGetMaterial } from "../../data/materials"
import { Module } from "../../data/modules"
import { useGetElementVisible } from "../../hooks/elementCategories"
import { useModuleElementGeometries } from "../../hooks/geometries"
import { ColumnLayoutKeyInput } from "../../hooks/layouts"
import { RM, S } from "../../utils/functions"

type Props = ColumnLayoutKeyInput & {
  houseId: string
  module: Module
  columnZ: number
  levelY: number
  moduleZ: number
}

const GltfModule2 = (props: Props) => {
  const { houseId, module, columnZ, levelY, moduleZ } = props
  const { systemId, dna } = module

  const elementMap = useModuleElementGeometries(systemId, dna)

  const getMaterial = useGetMaterial(houseId)
  const getElementVisible = useGetElementVisible(systemId)

  return (
    <Fragment>
      {pipe(
        elementMap,
        RM.filterWithIndex(getElementVisible),
        RM.collect(S.Ord)((elementName, geometry) => (
          <mesh
            key={elementName}
            geometry={geometry}
            material={getMaterial(elementName)}
            position={[0, levelY, columnZ + moduleZ]}
          />
        ))
      )}
    </Fragment>
  )
}

export default GltfModule2
