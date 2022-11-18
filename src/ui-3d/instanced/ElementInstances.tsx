import { Instances } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import { useHashedMaterial } from "../../hooks/hashedMaterials"
import {
  splitGeometryMaterialHash,
  useElementInstances,
  useElementInstancesKeys,
} from "../../hooks/elementInstances"
import { RA, RR } from "../../utils/functions"
import ElementInstance from "./ElementInstance"

const ElementInstancesSet = ({ hash }: { hash: string }) => {
  const [geometryHash, materialHash] = splitGeometryMaterialHash(hash)
  const geometry = useHashedGeometry(geometryHash)
  const material = useHashedMaterial(materialHash)

  const instances = useElementInstances(hash)

  return (
    <Instances
      limit={100} // Optional: max amount of items (for calculating buffer size)
      range={100} // Optional: draw-range
      geometry={geometry}
      material={material}
    >
      {pipe(
        instances,
        RR.toReadonlyArray,
        RA.map(([hash, data]) => <ElementInstance key={hash} data={data} />)
      )}
    </Instances>
  )
}

const ElementInstances = () => {
  const instanceKeys = useElementInstancesKeys()

  return (
    <Fragment>
      {pipe(
        instanceKeys,
        RA.map((key) => {
          return <ElementInstancesSet key={key} hash={key} />
        })
      )}
    </Fragment>
  )
}

export default ElementInstances
