import { Fragment, PropsWithChildren } from "react"
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

  console.log({ systemModules, systemElements, systemMaterials, loaded })

  return <Fragment>{loaded ? children : null}</Fragment>
}

export default DataInit
