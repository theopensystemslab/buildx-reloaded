import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
import { ref } from "valtio"
import ifcStore, { useIFCLoader } from "../../hooks/ifcStore"

const TestIfcApp = () => {
  const scene = useThree((t) => t.scene)

  const ifcLoader = useIFCLoader()

  useEffect(() => {
    ifcLoader.load("../../../01.ifc", (ifcModel) => {
      ifcStore.models["foo"] = ref(ifcModel)
      scene.add(ifcModel)
    })
  }, [ifcLoader, scene])

  return null
}

export default TestIfcApp
