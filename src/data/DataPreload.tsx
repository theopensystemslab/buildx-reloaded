import { useLoader } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { useSnapshot } from "valtio"
import { IFCLoader } from "web-ifc-three"
import systemModules from "../hooks/modules"
import { RA, RR } from "../utils/functions"

const DataPreload = () => {
  const snap = useSnapshot(systemModules)

  pipe(
    snap,
    RR.map(
      RA.map((m) => {
        useLoader.preload(IFCLoader, m.ifcUrl, (loader) => {
          if (loader instanceof IFCLoader) {
            loader.ifcManager.setWasmPath("../../../wasm/")
          }
        })
      })
    )
  )

  return null
}

export default DataPreload
