import { useGLTF } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import { preload } from "suspend-react"
import { useSnapshot } from "valtio"
import { loadIfcModel } from "../hooks/ifc"
import systemModules from "../hooks/modules"
import { RA, RR } from "../utils/functions"

const DataPreload = () => {
  const snap = useSnapshot(systemModules)

  console.log("im DataPreload")

  pipe(
    snap,
    RR.map(
      RA.map((m) => {
        preload(
          async (...keys) => {
            console.log("preloading something")
            const [ifcModelUrl] = keys
            await loadIfcModel(ifcModelUrl)
          },
          [m.ifcUrl]
        )

        console.log("preloading")

        useGLTF.preload(m.modelUrl)

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
