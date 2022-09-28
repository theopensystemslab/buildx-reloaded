import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
import { RectReadOnly } from "react-use-measure"
import { Event, Intersection, Mesh, Object3D } from "three"
import { proxy, ref, useSnapshot } from "valtio"
import { subscribeKey } from "valtio/utils"
import ifcStore from "./ifcStore"

type GlobalStore = {
  size: RectReadOnly | null
  pointerXY: V2
  groundMesh: Mesh | null
  sidebar: boolean
  preload: boolean
  intersection: Intersection<Object3D<Event>> | null
}

const globals = proxy<GlobalStore>({
  size: null,
  pointerXY: [0, 0],
  groundMesh: null,
  sidebar: false,
  preload: false,
  intersection: null,
})

export const useGlobals = () => useSnapshot(globals)

export const setSidebar = (b: boolean) => {
  globals.sidebar = b
  if (!globals.preload) globals.preload = true
}

// const raycaster = useMemo(() => new Raycaster(), [])

// useEffect(() => {
//   return subscribeKey(globals, "pointerXY", () => {
//     // console.log(ifcStore.models)
//     const [x, y] = globals.pointerXY
//     raycaster.setFromCamera({ x, y }, camera)
//     const ifcModels = Object.values(ifcStore.models)
//     const foo = raycaster.intersectObjects(ifcModels)
//     if (foo.length > 0) console.log(foo.length)
//   })
// }, [camera, raycaster])

export const useRaycasting = () => {
  const raycaster = useThree((t) => t.raycaster)
  const camera = useThree((t) => t.camera)

  useEffect(
    () =>
      subscribeKey(globals, "pointerXY", () => {
        const [x, y] = globals.pointerXY
        raycaster.setFromCamera({ x, y }, camera)
        const intersections = raycaster.intersectObjects(
          Object.values(ifcStore.models)
        )
        if (intersections.length > 0) {
          globals.intersection = ref(intersections[0])
        } else {
          globals.intersection = null
        }
        console.log(globals.intersection)
      }),
    [camera, raycaster]
  )
}
export default globals
