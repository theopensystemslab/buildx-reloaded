import { Camera } from "@carbon/icons-react"
import { RootState } from "@react-three/fiber"
import { CameraLayer, RaycasterLayer } from "../constants"

export const onCreated = (state: RootState) => {
  state.gl.localClippingEnabled = true
  state.raycaster.layers.disableAll()
  state.raycaster.layers.enable(CameraLayer.VISIBLE)
  state.raycaster.layers.enable(CameraLayer.INVISIBLE)
  state.raycaster.layers.enable(RaycasterLayer.ENABLED)
}
