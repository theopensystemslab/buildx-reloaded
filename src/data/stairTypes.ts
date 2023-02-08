import * as z from "zod"
import Airtable from "airtable"
import { pipe } from "fp-ts/lib/function"
import { systemFromId } from "./system"
import { proxy, useSnapshot } from "valtio"
import { trpc } from "../utils/trpc"

export type StairType = {
  id: string
  systemId: string
  code: string
  description: string
  imageUrl: string
}

export const stairTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    stair_code: z.string().min(1),
    description: z.string().min(1),
    image: z
      .array(
        z.object({
          url: z.string().min(1),
        })
      )
      .default([]),
  }),
})

export const stairTypesQuery =
  (airtable: Airtable) =>
  async ({
    input: { systemId },
  }: {
    input: { systemId: string }
  }): Promise<StairType[]> =>
    pipe(
      airtable
        .base(systemFromId(systemId)?.airtableId ?? "")
        .table("stair_type")
        .select()
        .all()
        .then(
          z.array(
            stairTypeParser.transform(
              ({ id, fields: { stair_code, description, image } }) => ({
                id,
                systemId,
                code: stair_code,
                description,
                imageUrl: image?.[0]?.url,
              })
            )
          ).parse
        )
    )

const stairTypes = proxy<Record<string, StairType[]>>({})

export const useSystemStairTypes = ({ systemId }: { systemId: string }) => {
  const snap = useSnapshot(stairTypes) as typeof stairTypes
  return snap?.[systemId] ?? []
}

export const useInitSystemStairTypes = ({ systemId }: { systemId: string }) => {
  trpc.stairTypes.useQuery(
    {
      systemId: systemId,
    },
    {
      onSuccess: (data) => {
        stairTypes[systemId] = data
      },
    }
  )
  return useSystemStairTypes({ systemId })
}

export default stairTypes
