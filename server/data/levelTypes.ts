import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { A } from "~/utils/functions"
import { systemFromId } from "./system"
import { QueryFn } from "./types"

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

export const levelTypesQuery: QueryFn<LevelType> =
  (airtable) =>
  async ({ input: { systemIds } }) =>
    pipe(
      systemIds,
      A.map((systemId) =>
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
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
