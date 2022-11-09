import { Instance, Instances } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { hashedGeometries } from "../../hooks/hashedGeometries"
import hashedMaterials from "../../hooks/hashedMaterials"
import {
  splitGeometryMaterialHash,
  useElementGeometryMaterialHashes,
  useElementInstanceValues,
} from "../../hooks/instances"
import { RA } from "../../utils/functions"

const ElementInstancesChildren = ({ hash }: { hash: string }) => {
  const instanceValues = useElementInstanceValues(hash)

  console.log(instanceValues)

  return (
    <Fragment>
      {pipe(
        instanceValues,
        RA.mapWithIndex((i, { position, scale }) => (
          <Instance key={i} {...{ position, scale }} />
        ))
      )}
    </Fragment>
  )
}

const ElementInstances = () => {
  const hashes = useElementGeometryMaterialHashes()

  return (
    <Fragment>
      {pipe(
        hashes,
        RA.map((hash) =>
          pipe(hash, splitGeometryMaterialHash, ([geomHash, matHash]) => (
            <Instances
              key={hash}
              geometry={hashedGeometries.get(geomHash)}
              material={hashedMaterials.get(matHash)}
            >
              <ElementInstancesChildren key={hash} hash={hash} />
            </Instances>
          ))
        )
      )}
    </Fragment>
  )
}

export default ElementInstances
