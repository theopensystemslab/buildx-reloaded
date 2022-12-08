import { trpc } from "@/utils/trpc"
import Airtable from "airtable"
import { filter, map } from "fp-ts/lib/Array"
import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { systemFromId, systemIdParser, systems } from "./system"

const modulesByHouseTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    module_code: z.array(z.string().min(1)),
    module: z.array(z.string().min(1)),
  }),
})

export const houseTypeParser = z
  .object({
    fields: z
      .object({
        // id: z.string().min(1),
        house_type_code: z.string().min(1),
        modules: z.array(z.string().min(1)),
        image: z.array(
          z.object({
            url: z.string().min(1),
          })
        ),
        description: z.string().min(1),
        cost: z.number(),
        embodied_carbon: z.number(),
      })
      .passthrough(),
    id: z.string().min(1),
  })
  .transform(
    ({
      id,
      fields: {
        house_type_code,
        modules,
        image,
        description,
        cost,
        embodied_carbon,
      },
    }) => ({
      id,
      name: house_type_code,
      dna: modules,
      imageUrl: image[0].url,
      description,
      cost,
      carbon: embodied_carbon,
    })
  )

export const systemHouseTypesQuery =
  (airtable: Airtable) =>
  async ({
    input: { systemId },
  }: {
    input: z.infer<typeof systemIdParser>
  }) => {
    const system = systemFromId(systemId)
    if (!system) throw new Error(`No such system ${systemId}`)

    const modulesByHouseType = await airtable
      .base(system.airtableId)
      .table("modules_by_housetype")
      .select()
      .all()
      .then((x) => {
        const parsed = z.array(modulesByHouseTypeParser).safeParse(x)

        if (parsed.success) return parsed.data
        else return []
      })

    const houseTypes = await pipe(
      airtable
        .base(system.airtableId)
        .table("house_types")
        .select()
        .all()
        .then(z.array(houseTypeParser).parse)
        .then((xs) =>
          xs.map(({ dna, ...rest }) => ({
            systemId: system.id,
            dna: pipe(
              dna,
              map((modulesByHouseTypeId) => {
                const moduleByHouseType = modulesByHouseType.find(
                  (m) => m.id === modulesByHouseTypeId
                )
                return moduleByHouseType?.fields.module_code[0]
              }),
              filter((x): x is string => Boolean(x))
            ),
            ...rest,
          }))
        )
    )

    return houseTypes
  }

export const allHouseTypesQuery = (airtable: Airtable) => () =>
  Promise.all(
    pipe(
      systems,
      map((system) =>
        systemHouseTypesQuery(airtable)({
          input: { systemId: system.id },
        })
      )
    )
  ).then((xs) => xs.flat())

export type HouseType = z.infer<typeof houseTypeParser> & { systemId: string }

export const useSystemHouseTypes = ({ systemId }: { systemId: string }) =>
  trpc.systemHouseTypes.useQuery({
    systemId: systemId,
  }).data ?? []

export const useAllHouseTypes = () => trpc.allHouseTypes.useQuery()
