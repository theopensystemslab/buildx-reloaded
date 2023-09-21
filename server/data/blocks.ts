import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { A } from "~/utils/functions"
import { systemFromId } from "./system"
import { QueryFn } from "./types"

export type Block = {
  id: string
  systemId: string
  name: string
  sheetQuantity: number
  materialsCost: number // -> material cost
  manufacturingCost: number // -> manufacturer cost
  totalCost: number
  cuttingFileUrl: string
  lastModified: number
}

export const blockTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    Name: z.string().min(1),
    "Sheet Quantity": z.number().default(1), // sheets per block right?
    Materials_cost: z.number().default(0),
    Manufacturing_cost: z.number().default(0),
    Total_cost: z.number().default(0),
    Github_cutting_file: z.string().min(1),
    "Last Modified": z
      .string()
      .refine(
        (value) => {
          // Attempt to parse the value as a date and check that it's valid
          const date = new Date(value)
          return !isNaN(date.getTime())
        },
        {
          // Custom error message
          message: "Invalid date string",
        }
      )
      .transform((x) => new Date(x).getTime()),
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
                      Manufacturing_cost: manufacturingCost,
                      Total_cost: totalCost,
                      Github_cutting_file,
                      "Last Modified": lastModified,
                    },
                  }): Block => ({
                    id,
                    systemId,
                    name,
                    sheetQuantity,
                    materialsCost,
                    manufacturingCost,
                    totalCost,
                    cuttingFileUrl: Github_cutting_file,
                    lastModified,
                  })
                )
              ).parse
            )
        )
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
