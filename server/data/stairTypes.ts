import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { A } from "../../src/utils/functions"
import { systemFromId } from "./system"
import { QueryFn } from "./types"

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

export const stairTypesQuery: QueryFn<StairType> =
  (airtable) =>
  async ({ input: { systemIds } }) =>
    pipe(
      systemIds,
      A.map((systemId) =>
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
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
