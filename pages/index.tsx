import DataInit from "@/data/DataInit"
import DefaultApp from "@/ui-3d/default/DefaultApp"
import AppInit from "@/ui-3d/init/AppInit"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useEffect } from "react"
import { useGlobals } from "../src/hooks/globals"
import hashedMaterials from "../src/hooks/hashedMaterials"
import DebugDimensions from "../src/ui-3d/debug/DebugDimensions"
import { RR } from "../src/utils/functions"

const IndexPage = () => {
  const { debug } = useGlobals()

  return (
    <Fragment>
      <DataInit>
        <AppInit>
          <DefaultApp />
          {debug && <DebugDimensions />}
        </AppInit>
      </DataInit>
    </Fragment>
  )
}

export default IndexPage
