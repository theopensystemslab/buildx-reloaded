import IfcHouse from "@/ui-3d/ifc/IfcHouse"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { useHouses } from "../../hooks/houses"
import { RA, RR } from "../../utils/functions"
import TestBox from "../TestBox"

const App = () => {
  const houses = useHouses()

  const children = pipe(
    houses,
    RR.keys,
    RA.map((id) => <IfcHouse key={id} id={id} />)
  )

  // const raycaster = useMemo(() => new Raycaster(), [])

  // useEffect(() => {
  //   return subscribeKey(globals, "pointerXY", () => {
  //     // console.log(ifcStore.models)
  //     const [x, y] = globals.pointerXY
  //     raycaster.setFromCamera({ x, y }, camera)
  //     const ifcModels = Object.values(ifcStore.models)
  //     const foo = raycaster.intersectObjects(ifcModels)
  //     if (foo.length > 0) console.log(foo.length)
  //   })
  // }, [camera, raycaster])

  return (
    <Fragment>
      <TestBox />
      {children}
    </Fragment>
  )
}

export default App
