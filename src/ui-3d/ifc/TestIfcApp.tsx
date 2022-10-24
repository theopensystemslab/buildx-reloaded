import { useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { MeshLambertMaterial, Raycaster, Vector2 } from "three"
import { ref } from "valtio"
import ifcStore, { useIFCLoader } from "../../hooks/ifcStore"

const TestIfcApp = () => {
  const scene = useThree((t) => t.scene)
  const size = useThree((t) => t.size)
  const raycaster = useThree((t) => t.raycaster)
  const camera = useThree((t) => t.camera)

  const highlightMaterial = useMemo(
    () =>
      new MeshLambertMaterial({
        transparent: true,
        opacity: 0.6,
        color: 0xff88ff,
        depthTest: false,
      }),
    []
  )

  const highlightIndex = useRef(-1)

  const ifcLoader = useIFCLoader()

  const ifcManager = ifcLoader.ifcManager

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

    function highlight(event: any, material: any, model: any) {
      const found: any = cast(event)[0]
      if (found) {
        // Gets model ID
        model.id = found.object.modelID

        // Gets Express ID
        const index = found.faceIndex
        const geometry = found.object.geometry
        const id = ifcManager.getExpressId(geometry, index)

        // Creates subset
        ifcLoader.ifcManager.createSubset({
          modelID: model.id,
          ids: [id],
          material: material,
          scene: scene,
          removePrevious: true,
        })
      } else {
        // Remove previous highlight
        // @ts-ignore
        ifcManager.removeSubset(model.id, scene, material)
      }
    }

    window.onmousemove = (event) =>
      highlight(event, highlightMaterial, { id: highlightIndex.current })
  }, [camera, highlightMaterial, ifcLoader, ifcManager, raycaster, scene, size])

  return null
}

export default TestIfcApp
