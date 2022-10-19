import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useSnapshot } from "valtio"
import obbs from "../../hooks/obb"
import { RA, RR } from "../../utils/functions"
import DebugBox from "./DebugBox"

const DebugApp = () => {
  const debugBoxes = useSnapshot(obbs)

  const debugChildren = pipe(
    debugBoxes,
    RR.keys,
    RA.map((id) => <DebugBox key={id} houseId={id} />)
  )
  return <Fragment>{debugChildren}</Fragment>
}

export default DebugApp
