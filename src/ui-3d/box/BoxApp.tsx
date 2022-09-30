import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useHouses } from "../../hooks/houses"
import { RA, RR } from "../../utils/functions"
import BoxHouse from "./BoxHouse"

const BoxApp = () => {
  const houses = useHouses()

  const children = pipe(
    houses,
    RR.keys,
    RA.map((id) => <BoxHouse key={id} id={id} />)
  )

  return <Fragment>{children}</Fragment>
}

export default BoxApp
