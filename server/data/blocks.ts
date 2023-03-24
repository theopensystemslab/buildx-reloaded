import Airtable from "airtable"
import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { A } from "../../src/utils/functions"
import { systemFromId } from "./system"

export type Block = {
  id: string
  systemId: string
  name: string
  sheetQuantity: number
  plywoodCost: number
  // moduleDnas: string[]
  // costPerM2: number
  // embodiedCarbonPerGWP: number
  // code: string
  // description: string
  // imageUrl: string
  // glazingArea: number
}

export const blockTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    Name: z.string().min(1),
    "Sheet Quantity": z.number().default(1), // sheets per block right?
    Plywood_cost: z.number().default(0),

    // module_line: z.string().min(1),
    // description: z.string().min(1),
    // image: z
    //   .array(
    //     z.object({
    //       url: z.string().min(1),
    //     })
    //   )
    //   .default([]),
    // glazing_area: z.number(),
  }),
})

export const blocksQuery =
  (airtable: Airtable) =>
  async ({
    input: { systemIds },
  }: {
    input: { systemIds: string[] }
  }): Promise<Block[]> =>
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
                      Plywood_cost: plywoodCost,
                    },
                  }) => ({
                    id,
                    systemId,
                    name,
                    sheetQuantity,
                    plywoodCost,
                  })
                )
              ).parse
            )
        )
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
