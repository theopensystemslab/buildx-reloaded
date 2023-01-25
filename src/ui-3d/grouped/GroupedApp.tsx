import { useHouseKeys } from "@/hooks/houses"
import { Instances } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { useDragHandler, useGestures } from "../../hooks/gestures"
import { useHandleMaterial } from "../../hooks/handleMaterial"
import { RA } from "../../utils/functions"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import GroupedHouse from "./GroupedHouse"

const GroupedApp = () => {
  const houseKeys = useHouseKeys()
  const bindAll = useGestures()
  useDragHandler()

  const handleMaterial = useHandleMaterial()

  return (
    <Fragment>
      <group {...bindAll()}>
        <Instances material={handleMaterial}>
          <circleGeometry args={[0.5, 10]} />
          {pipe(
            houseKeys,
            RA.map((houseId) => (
              <Suspense key={houseId} fallback={null}>
                <GroupedHouse houseId={houseId} />
              </Suspense>
            ))
          )}
        </Instances>
      </group>
      <XZPlane />
      <YPlane />
    </Fragment>
  )
}

export default GroupedApp
