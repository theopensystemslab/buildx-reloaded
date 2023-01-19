import Airtable from "airtable"
import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { trpc } from "../utils/trpc"
import { systemFromId } from "./system"
import { proxy, useSnapshot } from "valtio"

export interface LevelType {
  id: string
  systemId: string
  code: string
  description: string
}

export const levelTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    level_code: z.string().min(1),
    description: z.string().min(1),
  }),
})

export const levelTypesQuery =
  (airtable: Airtable) =>
  async ({
    input: { systemId },
  }: {
    input: { systemId: string }
  }): Promise<LevelType[]> =>
    pipe(
      airtable
        .base(systemFromId(systemId)?.airtableId ?? "")
        .table("level_type")
        .select()
        .all()
        .then(
          z.array(
            levelTypeParser.transform(
              ({ id, fields: { level_code, description } }): LevelType => ({
                id,
                systemId,
                code: level_code,
                description,
              })
            )
          ).parse
        )
    )

const levelTypes = proxy<Record<string, LevelType[]>>({})

export const useSystemLevelTypes = ({ systemId }: { systemId: string }) => {
  const snap = useSnapshot(levelTypes) as typeof levelTypes
  return snap?.[systemId] ?? []
}

export const useInitSystemLevelTypes = ({ systemId }: { systemId: string }) => {
  trpc.levelTypes.useQuery(
    {
      systemId: systemId,
    },
    {
      onSuccess: (data) => {
        levelTypes[systemId] = data
      },
    }
  )
  return useSystemLevelTypes({ systemId })
}

export default levelTypes
