import { useGLTF } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import { useSnapshot } from "valtio"
import systemModules from "../hooks/modules"
import { RA, RR } from "../utils/functions"

const DataPreload = () => {
  const snap = useSnapshot(systemModules)

  pipe(
    snap,
    RR.map(
      RA.map((m) => {
        useGLTF.preload(m.ifcUrl)

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
