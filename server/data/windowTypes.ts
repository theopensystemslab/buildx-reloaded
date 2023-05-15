import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { A } from "~/utils/functions"
import { systemFromId } from "./system"
import { QueryFn } from "./types"

export type WindowType = {
  id: string
  systemId: string
  code: string
  description: string
  imageUrl: string
  glazingArea: number
}

export const windowTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    opening_set: z.string().min(1),
    description: z.string().min(1),
    image: z
      .array(
        z.object({
          url: z.string().min(1),
        })
      )
      .default([]),
    glazing_area: z.number(),
  }),
})

export const windowTypesQuery: QueryFn<WindowType> =
  (airtable) =>
  async ({ input: { systemIds } }) =>
    pipe(
      systemIds,
      A.map((systemId) =>
        airtable
          .base(systemFromId(systemId)?.airtableId ?? "")
          .table("window_type")
          .select()
          .all()
          .then(
            z.array(
              windowTypeParser.transform(
                ({
                  id,
                  fields: { opening_set, description, image, glazing_area },
                }) => ({
                  id,
                  systemId,
                  code: opening_set,
                  description,
                  imageUrl: image?.[0]?.url,
                  glazingArea: glazing_area,
                })
              )
            ).parse
          )
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
