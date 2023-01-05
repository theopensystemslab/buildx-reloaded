import { Fragment, PropsWithChildren } from "react"
import Loader from "../ui/Loader"
import { useInitSystemElements } from "./elements"
import { useInitSystemMaterials } from "./materials"
import { useInitSystemModules } from "./modules"

const DataInit = ({ children }: PropsWithChildren<{}>) => {
  const systemModules = useInitSystemModules({ systemId: "skylark" })
  const systemElements = useInitSystemElements({ systemId: "skylark" })
  const systemMaterials = useInitSystemMaterials({ systemId: "skylark" })

  const loaded = [systemModules, systemElements, systemMaterials].reduce(
    (acc, v) => acc && v.length > 0,
    true
  )

  return <Fragment>{loaded ? children : <Loader />}</Fragment>
}

export default DataInit
