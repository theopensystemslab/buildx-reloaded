import { RectReadOnly } from "react-use-measure"
import { Mesh } from "three"
import { proxy, useSnapshot } from "valtio"

type GlobalStore = {
  size: RectReadOnly | null
  pointerXY: V2
  groundMesh: Mesh | null
  sidebar: boolean
  preload: boolean
}

const globals = proxy<GlobalStore>({
  size: null,
  pointerXY: [0, 0],
  groundMesh: null,
  sidebar: false,
  preload: false,
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

export default globals
