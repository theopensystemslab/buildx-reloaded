import { Instance, Instances } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useInstances } from "../../hooks/instances"
import { RA, RM, S } from "../../utils/functions"

const Instantiaminatrixificator = () => {
  const instances = useInstances()

  return (
    <Fragment>
      {pipe(
        instances,

        RM.collect(S.Ord)((key, instanceData) => (
          <Instances
            key={key}
            limit={1000} // Optional: max amount of items (for calculating buffer size)
            range={1000} // Optional: draw-range
          >
            <boxGeometry />
            <meshStandardMaterial />

            {pipe(
              instanceData,
              RA.map((instanceDatum) => {
                const {
                  systemId,
                  houseId,
                  columnIndex,
                  levelIndex,
                  gridGroupIndex,
                  dna,
                  elementName,
                  position,
                  rotation,
                } = instanceDatum
                return (
                  <Instance
                    key={JSON.stringify({
                      systemId,
                      houseId,
                      columnIndex,
                      levelIndex,
                      gridGroupIndex,
                      dna,
                      elementName,
                    })}
                    position={position}
                    rotation={[0, rotation, 0]}
                  />
                )
              })
            )}
          </Instances>
        ))
      )}
    </Fragment>
  )
}

export default Instantiaminatrixificator
