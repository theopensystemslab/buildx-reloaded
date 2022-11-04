import { Instance, Instances } from "@react-three/drei"
import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { getGeometry } from "../../hooks/geometries"
import { useInstances } from "../../hooks/instances"
import { RA, RM, S } from "../../utils/functions"

const Instantiaminatrixificator = () => {
  const instances = useInstances()

  const bind = useGesture({
    onHover: (state: any) => {
      console.log(state.event.intersections.map((ix: any) => ix.instanceId))
    },
  })

  return (
    <Fragment>
      {pipe(
        instances,

        RM.collect(S.Ord)((key, instanceData) => {
          const { systemId, dna, elementName } = instanceData[0]
          const geometry = getGeometry({ systemId, dna, elementName })
          return (
            <Instances
              key={key}
              limit={1000} // Optional: max amount of items (for calculating buffer size)
              range={1000} // Optional: draw-range
              geometry={geometry}
              {...(bind() as any)}
            >
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
          )
        })
      )}
    </Fragment>
  )
}

export default Instantiaminatrixificator
