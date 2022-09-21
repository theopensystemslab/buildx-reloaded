import { useInitSystemModules } from "../hooks/modules"

const DataInit = () => {
  useInitSystemModules({ systemId: "skylark" })
  return null
}

export default DataInit
