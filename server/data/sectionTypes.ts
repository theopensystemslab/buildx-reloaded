import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { A } from "~/utils/functions"
import { systemFromId } from "./system"
import { QueryFn } from "./types"

export type SectionType = {
  id: string
  systemId: string
  code: string
  description: string
  width: number
  lastModified: number
}

export const sectionTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    section_code: z.string().min(1),
    description: z.string().default(""),
    section_width: z.number(),
    last_modified: z
      .string()
      .refine(
        (value) => {
          // Attempt to parse the value as a date and check that it's valid
          const date = new Date(value)
          return !isNaN(date.getTime())
        },
        {
          // Custom error message
          message: "Invalid date string",
        }
      )
      .transform((x) => new Date(x).getTime()),
  }),
})

export const sectionTypesQuery: QueryFn<SectionType> =
  (airtable) =>
  async ({ input: { systemIds } }) =>
    pipe(
      systemIds,
      A.map((systemId) =>
        airtable
          .base(systemFromId(systemId)?.airtableId ?? "")
          .table("section_type")
          .select()
          .all()
          .then(
            z.array(
              sectionTypeParser.transform(
                ({
                  id,
                  fields: {
                    section_code,
                    description,
                    section_width,
                    last_modified: lastModified,
                  },
                }) => ({
                  id,
                  systemId,
                  code: section_code,
                  description,
                  width: section_width,
                  lastModified,
                })
              )
            ).parse
          )
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
