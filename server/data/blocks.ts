import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { A } from "../../src/utils/functions"
import { systemFromId } from "./system"
import { QueryFn } from "./types"

export type Block = {
  id: string
  systemId: string
  name: string
  sheetQuantity: number
  materialsCost: number // -> material cost
  totalCost: number
}

export const blockTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    Name: z.string().min(1),
    "Sheet Quantity": z.number().default(1), // sheets per block right?
    Materials_cost: z.number().default(0),
    Total_cost: z.number().default(0),
  }),
})

export const blocksQuery: QueryFn<Block> =
  (airtable) =>
  async ({ input: { systemIds } }) =>
    pipe(
      systemIds,
      A.map((systemId) =>
        pipe(
          airtable
            .base(systemFromId(systemId)?.airtableId ?? "")
            .table("All blocks")
            .select()
            .all()
            .then(
              z.array(
                blockTypeParser.transform(
                  ({
                    id,
                    fields: {
                      Name: name,
                      "Sheet Quantity": sheetQuantity,
                      Materials_cost: materialsCost,
                      Total_cost: totalCost,
                    },
                  }) => ({
                    id,
                    systemId,
                    name,
                    sheetQuantity,
                    materialsCost,
                    totalCost,
                  })
                )
              ).parse
            )
        )
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
