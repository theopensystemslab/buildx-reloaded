import { Instances } from "@react-three/drei"
import { identity, pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { useElementDragHandlers } from "../../hooks/drag/elements"
import { useHandleDragHandlers } from "../../hooks/drag/handles"
import { useHouseKeys } from "../../hooks/houses"
import {
  EditModeEnum,
  useEditMode,
  useSiteCtx,
  useSiteCtxMode,
} from "../../hooks/siteCtx"
import HandleMaterial from "../../materials/HandleMaterial"
import { RA } from "../../utils/functions"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import DefaultHouse from "./DefaultHouse"
import RotateHandleInstances from "../handles/RotateHandleInstances"
import StretchHandleInstances from "../handles/StretchHandleInstances"
import StretchInstances from "../stretch/StretchInstances"
import {
  DebugDimensionsCenterPoint,
  useDimensionsKeys,
} from "../../hooks/dimensions"

const DefaultApp = () => {
  const houseKeys = useHouseKeys()
  const { buildingHouseId: buildingId } = useSiteCtx()
  const siteCtxMode = useSiteCtxMode()
  const editMode = useEditMode()

  const bindElements = useElementDragHandlers()
  const bindHandles = useHandleDragHandlers()

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
      <Instances
        // range={1000}
        // limit={1000}
        {...bindHandles()}
      >
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

      {pipe(
        houseKeys,
        RA.map((id) => <DebugDimensionsCenterPoint key={id} houseId={id} />)
      )}
    </Fragment>
  )
}

export default DefaultApp
