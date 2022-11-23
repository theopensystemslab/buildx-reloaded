import { Instances } from "@react-three/drei"
import { identity, pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { DebugDimensionsCenterPoint } from "../../hooks/dimensions"
import { useElementDragHandlers } from "../../hooks/drag/elements"
import { useHandleDragHandlers } from "../../hooks/drag/handles"
import { useHouseKeys } from "../../hooks/houses"
import { EditModeEnum, useEditMode, useSiteCtx } from "../../hooks/siteCtx"
import HandleMaterial from "../../materials/HandleMaterial"
import { RA } from "../../utils/functions"
import RotateHandleInstances from "../handles/RotateHandleInstances"
import StretchHandleInstances from "../handles/StretchHandleInstances"
import StretchInstances from "../stretch/StretchInstances"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import DefaultHouse from "./DefaultHouse"

const DefaultApp = () => {
  const houseKeys = useHouseKeys()
  const { buildingHouseId: buildingId } = useSiteCtx()

  const editMode = useEditMode()

  const bindElements = useElementDragHandlers()
  const bindHandles = useHandleDragHandlers()

  const debugDimensions = true

  return (
    <Fragment>
      <group {...bindElements()}>
        {pipe(
          houseKeys,
          buildingId ? RA.filter((id) => id === buildingId) : identity,
          RA.map((id) => (
            <Suspense key={id} fallback={null}>
              <DefaultHouse houseId={id} />
            </Suspense>
          ))
        )}
      </group>
      <XZPlane />
      <YPlane />
      <Instances {...bindHandles()}>
        <circleBufferGeometry args={[0.5, 10]} />
        <HandleMaterial />
        {editMode === EditModeEnum.Enum.MOVE_ROTATE &&
          pipe(
            houseKeys,
            RA.map((houseId) => (
              <RotateHandleInstances key={houseId} houseId={houseId} />
            ))
          )}
        {editMode === EditModeEnum.Enum.STRETCH &&
          pipe(
            houseKeys,
            RA.map((houseId) => (
              <StretchHandleInstances key={houseId} houseId={houseId} />
            ))
          )}
      </Instances>
      <StretchInstances />
    </Fragment>
  )
}

export default DefaultApp
