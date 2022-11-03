import { useGLTF } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import { useAllSystemModules } from "./modules"
import { RA, RR } from "../utils/functions"

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
