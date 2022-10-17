import { RectReadOnly } from "react-use-measure"
import { Event, Intersection, Mesh, Object3D } from "three"
import { proxy, useSnapshot } from "valtio"

type GlobalStore = {
  size: RectReadOnly | null
  pointerXY: V2
  pointerXZ: V2
  groundMesh: Mesh | null
  sidebar: boolean
  preload: boolean
  intersection: Intersection<Object3D<Event>> | null
  orthographic: boolean
  shadows: boolean
}

const globals = proxy<GlobalStore>({
  size: null,
  pointerXY: [0, 0],
  pointerXZ: [0, 0],
  groundMesh: null,
  sidebar: false,
  preload: false,
  intersection: null,
  orthographic: false,
  shadows: true,
})

export const useGlobals = () => useSnapshot(globals)

export const setSidebar = (b: boolean) => {
  globals.sidebar = b
  if (!globals.preload) globals.preload = true
}

export default globals
