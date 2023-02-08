import { Fragment, PropsWithChildren } from "react"
import Loader from "../ui/Loader"
import { useInitSystemElements } from "./elements"
import { useInitSystemLevelTypes } from "./levelTypes"
import { useInitSystemMaterials } from "./materials"
import { useInitSystemModules } from "./modules"
import { useInitSystemSectionTypes } from "./sectionTypes"
import { useInitSystemStairTypes } from "./stairTypes"
import { useInitSystemWindowTypes } from "./windowTypes"

const DataInit = ({ children }: PropsWithChildren<{}>) => {
  const systemModules = useInitSystemModules({ systemId: "skylark" })
  const systemElements = useInitSystemElements({ systemId: "skylark" })
  const systemMaterials = useInitSystemMaterials({ systemId: "skylark" })
  const systemLevelTypes = useInitSystemLevelTypes({ systemId: "skylark" })
  const sectionTypes = useInitSystemSectionTypes({ systemId: "skylark" })
  const windowTypes = useInitSystemWindowTypes({ systemId: "skylark" })
  const stairTypes = useInitSystemStairTypes({ systemId: "skylark" })

  const loaded = [
    systemModules,
    systemElements,
    systemMaterials,
    systemLevelTypes,
    sectionTypes,
    windowTypes,
    stairTypes,
  ].reduce((acc, v) => acc && v.length > 0, true)

  return <Fragment>{loaded ? children : <Loader />}</Fragment>
}

export default DataInit
