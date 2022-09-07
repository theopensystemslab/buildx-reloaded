import Airtable from "airtable"
import { QueryParams } from "airtable/lib/query_params"
import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { systemFromId } from "./system"

export const moduleSelector: QueryParams<any> = {
  fields: ["module_code", "IFC_model"],
  filterByFormula: 'IFC_model!=""',
}

export const modulesInputParser = z.object({
  buildSystemId: z.string().min(1),
})

export const moduleParser = z
  .object({
    fields: z.object({
      ["module_code"]: z.string().min(1),
      ["IFC_model"]: z.array(
        z.object({
          url: z.string().min(1),
        })
      ),
    }),
  })
  .transform(({ fields: { module_code, IFC_model } }) => ({
    dna: module_code,
    ifcUrl: IFC_model[0].url,
  }))

export const modulesQuery =
  (airtable: Airtable) =>
  ({
    input: { buildSystemId },
  }: {
    input: z.infer<typeof modulesInputParser>
  }) =>
    pipe(
      airtable
        .base(systemFromId(buildSystemId)?.airtableId ?? "")
        .table("modules")
        .select(moduleSelector)
        .all()
        .then(z.array(moduleParser).parse)
    )
