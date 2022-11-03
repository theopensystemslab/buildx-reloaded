import { useInitSystemElements } from "./elements"
import { useInitSystemModules } from "./modules"
import { useInitSystemMaterials } from "./materials"

const DataInit = () => {
  useInitSystemModules({ systemId: "skylark" })
  useInitSystemElements({ systemId: "skylark" })
  useInitSystemMaterials({ systemId: "skylark" })
  return null
}

export default DataInit
