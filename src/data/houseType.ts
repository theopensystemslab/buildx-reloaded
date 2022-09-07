import Airtable from "airtable"
import { filter, map } from "fp-ts/lib/Array"
import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { systemFromId } from "./system"

const modulesByHouseTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    module_code: z.array(z.string().min(1)),
    module: z.array(z.string().min(1)),
  }),
})

export const houseTypesInputParser = z.object({
  buildSystemId: z.string().min(1),
})

export const houseTypeParser = z
  .object({
    fields: z.object({
      house_type_code: z.string().min(1),
      modules: z.array(z.string().min(1)),
    }),
  })
  .transform(({ fields: { house_type_code, modules } }) => ({
    name: house_type_code,
    modules,
  }))

export const houseTypesQuery =
  (airtable: Airtable) =>
  async ({
    input: { buildSystemId },
  }: {
    input: z.infer<typeof houseTypesInputParser>
  }) => {
    const base = systemFromId(buildSystemId)?.airtableId ?? ""

    const modulesByHouseType = await airtable
      .base(base)
      .table("modules_by_housetype")
      .select()
      .all()
      .then(z.array(modulesByHouseTypeParser).parse)

    const houseTypes = await pipe(
      airtable
        .base(base)
        .table("house_types")
        .select()
        .all()
        .then(z.array(houseTypeParser).parse)
        .then((xs) =>
          xs.map(({ name, modules }) => ({
            name,
            modules: pipe(
              modules,
              map((modulesByHouseTypeId) => {
                const moduleByHouseType = modulesByHouseType.find(
                  (m) => m.id === modulesByHouseTypeId
                )
                return moduleByHouseType?.fields.module_code[0]
              }),
              filter(Boolean)
            ),
          }))
        )
    )

    return houseTypes
  }
