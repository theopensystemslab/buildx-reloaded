import { RectReadOnly } from "react-use-measure"
import { Event, Intersection, Mesh, Object3D } from "three"
import { proxy, useSnapshot } from "valtio"

type GlobalStore = {
  size: RectReadOnly | null
  pointerXY: V2
  pointerXZ: V2
  pointerY: number
  groundMesh: Mesh | null
  sidebar: boolean
  preload: boolean
  intersection: Intersection<Object3D<Event>> | null
  orthographic: boolean
  shadows: boolean
  verticalCuts: {
    width: boolean
    length: boolean
  }
}

const globals = proxy<GlobalStore>({
  size: null,
  pointerY: 0,
  pointerXY: [0, 0],
  pointerXZ: [0, 0],
  groundMesh: null,
  sidebar: false,
  preload: true,
  intersection: null,
  orthographic: false,
  shadows: true,
  verticalCuts: {
    width: false,
    length: false,
  },
})

export const useGlobals = () => useSnapshot(globals)

export const setOrthographic = (b: boolean) => {
  globals.orthographic = b
}

export const setShadows = (b: boolean) => {
  globals.shadows = b
}

export const setSidebar = (b: boolean) => {
  globals.sidebar = b
  if (!globals.preload) globals.preload = true
}

export const setVerticalCuts = (input: string[]) => {
  globals.verticalCuts.width = input.includes("width")
  globals.verticalCuts.length = input.includes("length")
}

export const useVerticalCuts = () => {
  const { verticalCuts } = useGlobals()
  return [verticalCuts, setVerticalCuts] as const
}

export default globals
