"use client"

import { pipe } from "fp-ts/lib/function"
import { trpc } from "../../../client/trpc"
import houses, { useHouses } from "../../../src/hooks/houses"
import { A } from "../../../src/utils/functions"
import { useSubscribe } from "../../../src/utils/hooks"
import { useSelectedHouseIds } from "../../common/HousesPillsSelector"
import { useAllSystemBlocks } from "../../data/blocks"
import { useAllSystemModules } from "../../data/modules"
import OrderListTable from "./OrderListTable"

const useSelectedHouseBlockLineItems = () => {
  const selectedHouses = useSelectedHouseIds()
  const { data: allModules } = useAllSystemModules()
  const { data: allBlocks } = useAllSystemBlocks()

  console.log(allModules)
  // const { data: allBlocksByModule } = useAllSystemBlocksByModule()

  // return pipe(
  //   selectedHouses,
  //   A.map((houseId) => {
  //     const dnas = houses[houseId].dna
  //     return dnas
  //   })
  // )
}

const OrderIndex = () => {
  // iter buildings

  // iter dna

  // each dna -> block line items (array[])

  useSelectedHouseBlockLineItems()

  const foo = trpc.systemBlockModules.useQuery({ systemId: "skylark" })

  if (foo.data) console.log(foo.data)

  return (
    <div>
      <h1>Order list</h1>
      <p>
        A list of all the WikiHouse blocks you will need to build your project.
        All prices are estimated. Send this list to a WikiHouse manufacturer to
        get a precise quote.
      </p>
      {/* <OrderListTable blockLineItems={blockLineItems} /> */}
      <pre>{JSON.stringify(foo, null, 2)}</pre>
    </div>
  )
}

export default OrderIndex
