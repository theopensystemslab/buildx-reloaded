import { useGLTF } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import { RA, RR } from "../utils/functions"
import { useAllSystemModules } from "./modules"

const DataPreload = () => {
  const systemModules = useAllSystemModules()

  pipe(
    systemModules,
    RR.map(
      RA.map((m) => {
        useGLTF.preload(m.glbUrl)
        // useLoader.preload(IFCLoader, m.ifcUrl, (loader) => {
        //   if (loader instanceof IFCLoader) {
        //     loader.ifcManager.setWasmPath("../../../wasm/")
        //   }
        // })
      })
    )
  )

  return null
}

export default DataPreload
