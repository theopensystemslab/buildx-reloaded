import IfcHouse from "@/ui-3d/ifc/IfcHouse"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useHouses } from "../../hooks/houses"
import { useRaycasting } from "../../hooks/ifcStore"
import { RA, RR } from "../../utils/functions"

const App = () => {
  const houses = useHouses()

  const children = pipe(
    houses,
    RR.keys,
    RA.map((id) => <IfcHouse key={id} id={id} />)
  )

  useRaycasting()

  return <Fragment>{children}</Fragment>
}

export default App
