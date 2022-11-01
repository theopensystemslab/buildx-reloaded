import { useInitSystemElements } from "../hooks/elements"
import { useInitSystemModules } from "../hooks/modules"

const DataInit = () => {
  useInitSystemModules({ systemId: "skylark" })
  useInitSystemElements({ systemId: "skylark" })
  return null
}

export default DataInit
