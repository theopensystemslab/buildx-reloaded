"use client"
import { Fragment, PropsWithChildren } from "react"
import Loader from "../../src/ui/common/Loader"
import { useElements } from "./elements"
import { useHouseTypes } from "./houseTypes"
import { useLevelTypes } from "./levelTypes"
import { useMaterials } from "./materials"
import { useModules } from "./modules"
import { useSectionTypes } from "./sectionTypes"
import { useStairTypes } from "./stairTypes"
import { useWindowTypes } from "./windowTypes"

const DataInit = ({ children }: PropsWithChildren<{}>) => {
  const modules = useModules()
  const elements = useElements()
  const materials = useMaterials()
  const levelTypes = useLevelTypes()
  const sectionTypes = useSectionTypes()
  const windowTypes = useWindowTypes()
  const stairTypes = useStairTypes()
  const houseTypes = useHouseTypes()

  const loaded = [
    modules,
    elements,
    materials,
    levelTypes,
    sectionTypes,
    windowTypes,
    stairTypes,
    houseTypes,
  ].reduce((acc, v) => acc && v.length > 0, true)

  return <Fragment>{loaded ? children : <Loader />}</Fragment>
}

export default DataInit
