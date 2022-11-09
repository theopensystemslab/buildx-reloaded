import { Instance, Instances } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import { useHashedMaterial } from "../../hooks/hashedMaterials"
import {
  splitGeometryMaterialHash,
  useElementInstances,
  useElementInstancesKeys,
} from "../../hooks/instances"
import { RA, RR } from "../../utils/functions"

const ElementInstances = ({ hash }: { hash: string }) => {
  const [geometryHash, materialHash] = splitGeometryMaterialHash(hash)
  const geometry = useHashedGeometry(geometryHash)
  const material = useHashedMaterial(materialHash)

  const instances = useElementInstances(hash)

  return (
    <Instances geometry={geometry} material={material}>
      {pipe(
        instances,
        RR.toReadonlyArray,
        RA.map(([k, { position, scale }]) => {
          console.log(k)
          return <Instance key={k} {...{ position, scale }} />
        })
      )}
    </Instances>
  )
}

const ElementInstancesManager = () => {
  const instanceKeys = useElementInstancesKeys()

  return (
    <Fragment>
      {pipe(
        instanceKeys,
        RA.map((key) => {
          return <ElementInstances key={key} hash={key} />
        })
      )}
    </Fragment>
  )
}

export default ElementInstancesManager
