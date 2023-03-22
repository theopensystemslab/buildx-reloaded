import Airtable from "airtable"
import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { systemFromId } from "./system"

export type SectionType = {
  id: string
  systemId: string
  code: string
  description: string
  width: number
}

export const sectionTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    section_code: z.string().min(1),
    description: z.string().default(""),
    section_width: z.number(),
  }),
})

export const sectionTypesQuery =
  (airtable: Airtable) =>
  async ({
    input: { systemId },
  }: {
    input: { systemId: string }
  }): Promise<SectionType[]> =>
    pipe(
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
                fields: { section_code, description, section_width },
              }) => ({
                id,
                systemId,
                code: section_code,
                description,
                width: section_width,
              })
            )
          ).parse
        )
    )
