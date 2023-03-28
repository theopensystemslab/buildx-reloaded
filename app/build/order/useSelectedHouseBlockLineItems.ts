"use client"
import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { useMemo } from "react"
import { trpc } from "../../../client/trpc"
import { A, O, R, S } from "../../../src/utils/functions"
import {
  buildingColorVariants,
  useSelectedHouses,
} from "../../common/HousesPillsSelector"

export type BlockLineItem = {
  buildingName: string
  blockName: string
  sheetsPerBlock: number
  count: number
  materialsCost: number // connect  to element Structure's material cost
  costPerBlock: number
  colorClassName: string
  // totalInsulation: number
  // cuttingFiles: any
  // typicalCost: any
}

export const useSelectedHouseBlockLineItems = (): BlockLineItem[] => {
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

    console.log(accum)

    return pipe(
      selectedHouses,
      A.chain(({ id: houseId, dna: dnas, ...house }) =>
        pipe(
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
              O.toNullable
            ),
          })),
          A.reduce({}, (target: Record<string, number>, { blocks }) => {
            return produce(target, (draft) => {
              blocks?.forEach(({ blockId, count }) => {
                if (blockId in draft) {
                  draft[blockId] += count
                } else {
                  draft[blockId] = count
                }
              })
            })
          }),
          R.collect(S.Ord)((blockId, count) => ({
            buildingName: house.friendlyName,
            block: blocks.find(
              (block) =>
                block.systemId === house.systemId && block.id === blockId
            ),
            count,
            colorClassName:
              buildingColorVariants[
                selectedHouses.findIndex((x) => x.id === houseId)
              ],
          }))
        )
      ),

      A.filterMap(
        ({
          buildingName,
          block,
          count,
          colorClassName,
        }): O.Option<BlockLineItem> =>
          block
            ? O.some({
                blockName: block.name,
                buildingName,
                count,
                sheetsPerBlock: block.sheetQuantity,
                materialsCost: block.materialsCost * count,
                colorClassName,
                costPerBlock: block.totalCost,
              })
            : O.none
      )
    )
  }, [blockModulesEntries, blocks, modules, selectedHouses])
}
