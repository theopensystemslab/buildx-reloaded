// import { useIfcModuleElements } from "./data/elements"
import { suspend } from "suspend-react"
import { IFCLoader } from "web-ifc-three"
import { Module } from "@/data/modules"
import { IFCSITE } from "web-ifc"

export const useIfcModuleElements = ({ ifcUrl }: Pick<Module, "ifcUrl">) => {
  // const ifcModel: IFCModel = useLoader(IFCLoader, ifcUrl, (loader) => {
  //   if (loader instanceof IFCLoader) {
  //     loader.ifcManager.setWasmPath("../../../wasm/")
  //   }
  // })

  // ifcModel.ifcManager?.getSpatialStructure()
  const foo = suspend(async () => {
    const ifcLoader = new IFCLoader()
    const manager = ifcLoader.ifcManager
    ifcLoader.ifcManager.setWasmPath("../../../wasm/")
    ifcLoader.load(ifcUrl, async (ifcModel) => {
      const spatialStructure = await manager.getSpatialStructure(
        ifcModel.modelID
      )

      for (const child of spatialStructure.children[0].children) {
        const properties = await manager.getItemProperties(
          ifcModel.modelID,
          child.expressID,
          true
        )
        console.log(properties)
      }

      // const foo = await manager.getAllItemsOfType(
      //   ifcModel.modelID,
      //   IFCSITE,
      //   true
      // )
    })
  }, [])
}
const Foo = () => {
  const ifcUrl = "/S200-test.ifc"
  const foo = useIfcModuleElements({ ifcUrl })
  console.log(foo)

  console.log("hi")

  return null
}

export default Foo
