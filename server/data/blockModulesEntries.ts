import Airtable from "airtable"
import { QueryParams } from "airtable/lib/query_params"
import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { A } from "../../src/utils/functions"
import { systemFromId } from "./system"

const selector: QueryParams<any> = {
  filterByFormula: 'modules!=""',
}

export type BlockModulesEntry = {
  id: string
  systemId: string
  blockId: string
  moduleIds: string[]
  // name: string
  // moduleDnas: string[]
  // costPerM2: number
  // embodiedCarbonPerGWP: number
  // code: string
  // description: string
  // imageUrl: string
  // glazingArea: number
}

export const blockModulesEntryParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    block: z.array(z.string().min(1)).length(1),
    modules: z.array(z.string().min(1)),
    // Name: z.string().min(1),
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

export const blockModulesEntryQuery =
  (airtable: Airtable) =>
  async ({
    input: { systemIds },
  }: {
    input: { systemIds: string[] }
  }): Promise<BlockModulesEntry[]> => {
    return pipe(
      systemIds,
      A.map((systemId) =>
        pipe(
          airtable
            .base(systemFromId(systemId)?.airtableId ?? "")
            .table("blocks_by_module")
            .select(selector)
            .all()
            .then(
              z.array(
                blockModulesEntryParser.transform(
                  ({ id, fields: { block, modules } }): BlockModulesEntry => ({
                    id,
                    systemId,
                    blockId: block[0],
                    moduleIds: modules,
                  })
                )
              ).parse
              // z.array(
              //   blockModuleTypeParser.transform(({ id, fields: { Name } }) => ({
              //     id,
              //     systemId,
              //     name: Name,
              //     // code: opening_set,
              //     // description,
              //     // imageUrl: image?.[0]?.url,
              //     // glazingArea: glazing_area,
              //   }))
              // ).parse
            )
        )
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
  }
