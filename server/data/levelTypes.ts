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
  lastModified: number
}

export const levelTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    level_code: z.string().min(1),
    description: z.string().min(1),
    last_modified: z.string().refine(
      (value) => {
        // Attempt to parse the value as a date and check that it's valid
        const date = new Date(value)
        return !isNaN(date.getTime())
      },
      {
        // Custom error message
        message: "Invalid date string",
      }
    ),
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
                ({
                  id,
                  fields: { level_code, description, last_modified },
                }): LevelType => ({
                  id,
                  systemId,
                  code: level_code,
                  description,
                  lastModified: new Date(last_modified).getTime(),
                })
              )
            ).parse
          )
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
