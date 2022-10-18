import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useSnapshot } from "valtio"
import dimensions from "../../hooks/dimensions"
import { RA, RR } from "../../utils/functions"
import DebugBox from "./DebugBox"

const DebugApp = () => {
  const debugBoxes = useSnapshot(dimensions)

  const debugChildren = pipe(
    debugBoxes,
    RR.keys,
    RA.map((id) => <DebugBox key={id} houseId={id} />)
  )
  return <Fragment>{debugChildren}</Fragment>
}

export default DebugApp
