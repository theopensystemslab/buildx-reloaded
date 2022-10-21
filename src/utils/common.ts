import { RootState } from "@react-three/fiber"
import { RaycasterLayer } from "../constants"

export const onCreated = (state: RootState) => {
  state.gl.localClippingEnabled = true
  state.raycaster.layers.enable(RaycasterLayer.ENABLED)
  state.raycaster.layers.disable(RaycasterLayer.DISABLED)
}
