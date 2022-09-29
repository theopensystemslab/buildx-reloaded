import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
import { Raycaster, Vector2 } from "three"
import { ref } from "valtio"
import ifcStore, { useIFCLoader } from "../../hooks/ifcStore"

const TestIfcApp = () => {
  const scene = useThree((t) => t.scene)
  const size = useThree((t) => t.size)
  const raycaster = useThree((t) => t.raycaster)
  const camera = useThree((t) => t.camera)

  const ifcLoader = useIFCLoader()

  useEffect(() => {
    ifcLoader.load("../../../01.ifc", (ifcModel) => {
      ifcStore.models["foo"] = ref(ifcModel)
      scene.add(ifcModel)
    })

    const mouse = new Vector2()

    function cast(event: any) {
      // Computes the position of the mouse on the screen
      const { left, top } = size
      const right = size.left + size.width
      const bottom = size.top + size.height

      const x1 = event.clientX - left
      const x2 = right - left
      mouse.x = (x1 / x2) * 2 - 1

      const y1 = event.clientY - top
      const y2 = bottom - top
      mouse.y = -(y1 / y2) * 2 + 1

      // Places it on the camera pointing to the mouse
      raycaster.setFromCamera(mouse, camera)

      // Casts a ray
      return raycaster.intersectObjects(Object.values(ifcStore.models))
    }

    function pick(event: any) {
      const found: any = cast(event)[0]
      if (found) {
        const index = found.faceIndex
        const geometry = found.object.geometry
        const ifc = ifcLoader.ifcManager
        const id = ifc.getExpressId(geometry, index)
        console.log(id)
      }
    }

    window.ondblclick = pick
  }, [camera, ifcLoader, raycaster, scene, size])

  return null
}

export default TestIfcApp
