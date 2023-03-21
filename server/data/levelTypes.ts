import Airtable from "airtable"
import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { systemFromId } from "./system"

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
