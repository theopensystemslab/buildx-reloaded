"use client"

import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import { useMemo } from "react"
import { trpc } from "../../../client/trpc"
import { Block } from "../../../server/data/blocks"
import { systems } from "../../../server/data/system"
import houses, { useHouses } from "../../../src/hooks/houses"
import { A, NEA, O, R, S, someOrError } from "../../../src/utils/functions"
import { useSubscribe } from "../../../src/utils/hooks"
import {
  useSelectedHouseIds,
  useSelectedHouses,
} from "../../common/HousesPillsSelector"
import { useAllSystemBlocks } from "../../data/blocks"
import { useAllSystemModules } from "../../data/modules"
import OrderListTable from "./OrderListTable"

const useSelectedHouseBlockLineItems = () => {
  const selectedHouses = useSelectedHouses()
  const { data: modules = [] } = trpc.modules.useQuery()
  const { data: blocks = [] } = trpc.blocks.useQuery()
  const { data: blockModulesEntries = [] } = trpc.blockModulesEntry.useQuery()

  return useMemo(() => {
    const accum: Record<string, number> = {}

    for (const blockModuleEntry of blockModulesEntries) {
      const { systemId, blockId, moduleIds } = blockModuleEntry

      for (let moduleId of moduleIds) {
        const key = `${systemId}:${moduleId}:${blockId}`

        if (key in accum) {
          accum[key] += 1
        } else {
          accum[key] = 1
        }
      }
    }

    return pipe(
      selectedHouses,
      A.map(({ id: houseId, dna: dnas, ...house }) => ({
        houseId,
        modulesWithBlocks: pipe(
          dnas,
          A.map((dna) => ({
            ...pipe(
              modules,
              A.findFirstMap((module) =>
                module.systemId === house.systemId && module.dna === dna
                  ? O.some({
                      module,
                      blocks: pipe(
                        accum,
                        R.filterMapWithIndex((key, count) => {
                          const [systemId, moduleId, blockId] = key.split(":")
                          return systemId === house.systemId &&
                            moduleId === module.id
                            ? O.some(
                                pipe(
                                  blocks,
                                  A.filterMap((block) =>
                                    block.systemId === house.systemId &&
                                    block.id === blockId
                                      ? O.some({
                                          blockId,
                                          count,
                                        })
                                      : O.none
                                  )
                                )
                              )
                            : O.none
                        }),
                        values,
                        A.flatten
                      ),
                    })
                  : O.none
              ),
              someOrError(`errrr`)
            ),
          }))
        ),
      }))
    )
  }, [blockModulesEntries, blocks, modules, selectedHouses])
}

const OrderIndex = () => {
  // iter buildings

  // iter dna

  // each dna -> block line items (array[])

  const foo = useSelectedHouseBlockLineItems()

  console.log(foo)

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

// const systemBlockModulesEntries = A.isNonEmpty(blockModulesEntries)
//   ? pipe(
//       blockModulesEntries,
//       NEA.groupBy((blockModulesEntry) => blockModulesEntry.systemId)
//     )
//   : {}

// const systemModules = A.isNonEmpty(modules)
//   ? pipe(
//       modules,
//       NEA.groupBy((x) => x.systemId)
//       // maybe go in here and iterate blockModulesEntries
//       // R.map(NEA.groupBy((x) => x.id))
//     )
//   : {}

// const systemModulesWithBlocks = pipe(
//   systemModules,
//   R.mapWithIndex((systemId, modules) =>
//     pipe(
//       modules,
//       A.map((module) =>
//         pipe(
//           systemBlockModulesEntries[systemId],
//           NEA.reduce([], (b, blockModulesEntry) => {
//             if (blockModulesEntry.moduleIds.includes(module.id)) {
//               console.log("hit")
//             }
//             return b
//           })
//         )
//       )
//     )
//   )
// )

// // { "systemId"}

// // systemId : dna : blockId : number
// const foo: Record<
//   string,
//   Record<string, Record<string, number>>
// > = !A.isNonEmpty(blockModulesEntries)
//   ? {}
//   : pipe(
//       blockModulesEntries,
//       NEA.groupBy((blockModule) => blockModule.systemId),
//       R.reduceWithIndex(S.Ord)(
//         {},
//         (systemId, accumulator, blockModulesEntries) => ({
//           ...accumulator,
//           [systemId]: pipe(
//             blockModulesEntries,
//             A.reduce({}, (b, blockModulesEntry) => {
//               const blockId = blockModulesEntry.blockId

//               // moduleIds already in b?
//               // new moduleIds not in b?
//               // we're only ever +1'ing at this point I think

//               for (let moduleId of blockModulesEntry.moduleIds) {
//                 const ms = systemModules?.[systemId]?.[moduleId]
//                 if (!ms) continue
//                 const [m] = ms

//                 if (moduleId in b) console.log(m)

//                 // sometimes errors
//               }
//               return b
//             })
//           ),
//         })
//       )
//     )

// // group by system

// // reduce

// return pipe(
//   selectedHouses,
//   A.map(({ dna }) => {
//     // can we either append the blocks
//     // or create a lookup table
//   })
// )
// // const { data: allBlocksByModule } = useAllSystemBlocksByModule()

// // return pipe(
// //   selectedHouses,
// //   A.map((houseId) => {
// //     const dnas = houses[houseId].dna
// //     return dnas
// //   })
// // )
