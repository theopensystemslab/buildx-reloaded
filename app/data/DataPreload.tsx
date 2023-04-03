import { useGLTF } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import { RA, RR } from "../../src/utils/functions"
import { useModules } from "./modules"

const DataPreload = () => {
  const modules = useModules()

  pipe(
    modules,
    RA.map((m) => {
      useGLTF.preload(m.glbUrl)
      // useLoader.preload(IFCLoader, m.ifcUrl, (loader) => {
      //   if (loader instanceof IFCLoader) {
      //     loader.ifcManager.setWasmPath("../../../wasm/")
      //   }
      // })
    })
  )

  return null
}

export default DataPreload
