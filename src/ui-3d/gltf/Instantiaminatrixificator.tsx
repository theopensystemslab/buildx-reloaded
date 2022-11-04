import { Instance, Instances } from "@react-three/drei"
import { Position } from "@react-three/drei/helpers/Position"
import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { getGeometry } from "../../hooks/geometries"
import { useNewHouseEventsHandlers } from "../../hooks/houses"
import { InstanceData, useInstances } from "../../hooks/instances"
import { RA, RM, S } from "../../utils/functions"
import SingleInstance from "./SingleInstance"

const Instantiaminatrixificator = () => {
  const instances = useInstances()

  // const bind = useGesture<{ drag: ThreeEvent<PointerEvent> }>({
  //   onDrag: ({
  //     event: {
  //       object: { userData },
  //     },
  //   }) => {
  //     const {
  //       systemId,
  //       houseId,
  //       columnIndex,
  //       levelIndex,
  //       gridGroupIndex,
  //       dna,
  //       elementName,
  //     } = userData as InstanceData

  //     console.log(elementName)
  //   },
  // })
  const bind = useNewHouseEventsHandlers()

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
                RA.map(({ position, rotation, ...restProps }) => (
                  <SingleInstance
                    key={JSON.stringify(restProps)}
                    {...{ ...restProps, position, rotation }}
                  />
                ))
              )}
            </Instances>
          )
        })
      )}
    </Fragment>
  )
}

export default Instantiaminatrixificator
