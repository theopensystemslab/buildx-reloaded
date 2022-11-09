import { useInitSystemElements, useSystemElements } from "./elements"
import { useInitSystemModules, useSystemModules } from "./modules"
import { useInitSystemMaterials } from "./materials"
import { Fragment, PropsWithChildren } from "react"

const DataInit = ({ children }: PropsWithChildren<{}>) => {
  const systemModules = useInitSystemModules({ systemId: "skylark" })
  const systemElements = useInitSystemElements({ systemId: "skylark" })
  const systemMaterials = useInitSystemMaterials({ systemId: "skylark" })

  const loaded = [systemModules, systemElements, systemMaterials].reduce(
    (acc, v) => acc && v.length > 0,
    true
  )

  return <Fragment>{loaded ? children : null}</Fragment>
}

export default DataInit
