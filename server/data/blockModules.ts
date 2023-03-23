import Airtable from "airtable"
import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { systemFromId } from "./system"

export type BlockModules = {
  id: string
  systemId: string
  // name: string
  // moduleDnas: string[]
  // costPerM2: number
  // embodiedCarbonPerGWP: number
  // code: string
  // description: string
  // imageUrl: string
  // glazingArea: number
}

export const blockModuleTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    Name: z.string().min(1),
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

export const blockModulesQuery =
  (airtable: Airtable) =>
  async ({
    input: { systemId },
  }: {
    input: { systemId: string }
  }): Promise<BlockModules[]> =>
    pipe(
      airtable
        .base(systemFromId(systemId)?.airtableId ?? "")
        .table("blocks_by_module")
        .select()
        .all()
        .then(
          (foo) => {
            console.log({ foo })
            return foo as any
          }
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
