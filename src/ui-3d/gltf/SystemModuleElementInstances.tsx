import { Instances } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { getGeometry } from "../../hooks/geometries"
import { useNewHouseEventsHandlers } from "../../hooks/houses"
import { useInstances } from "../../hooks/instances"
import { RA, RM, S } from "../../utils/functions"
import SystemModuleElementInstance from "./SystemModuleElementInstance"

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
                  <SystemModuleElementInstance
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
