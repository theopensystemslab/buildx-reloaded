import { Instance, Instances } from "@react-three/drei"
import { ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { identity, pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import {
  useElementDragHandlers,
  useElementDragFunctions,
} from "../../hooks/dragEvents"
import houses, { useHouseKeys } from "../../hooks/houses"
import {
  EditModeEnum,
  useEditMode,
  useSiteCtx,
  useSiteCtxMode,
} from "../../hooks/siteCtx"
import HandleMaterial from "../../materials/HandleMaterial"
import { RA, RR } from "../../utils/functions"
import XZPlane from "../XZPlane"
import YPlane from "../YPlane"
import DefaultHouse from "./DefaultHouse"
import RotateHandleInstances from "./RotateHandleInstances"
import StretchHandleInstances from "./StretchHandleInstances"

const DefaultApp = () => {
  const houseKeys = useHouseKeys()
  const { buildingHouseId: buildingId } = useSiteCtx()
  const siteCtxMode = useSiteCtxMode()
  const editMode = useEditMode()

  const bindElements = useElementDragHandlers()

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
    </Fragment>
  )
}

export default DefaultApp
