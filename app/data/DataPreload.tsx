import { pipe } from "fp-ts/lib/function"
import { RA } from "~/utils/functions"
// import useSpeckleObject from "../utils/speckle/useSpeckleObject"
import { useModules } from "./modules"

const DataPreload = () => {
  const modules = useModules()

  pipe(
    modules,
    RA.map((m) => {
      // useSpeckleObject.preload(m.speckleBranchUrl)
      // console.log(`preloaded ${m.speckleBranchUrl}`)
      //
      // useGLTF.preload(m.glbUrl)
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
