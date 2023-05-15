import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { A } from "~/utils/functions"
import { systemFromId } from "./system"
import { QueryFn } from "./types"

export type SpaceType = {
  id: string
  systemId: string
  code: string
  description: string
}

export const spaceTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    space_code: z.string().min(1),
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

export const spaceTypesQuery: QueryFn<SpaceType> =
  (airtable) =>
  async ({ input: { systemIds } }) =>
    pipe(
      systemIds,
      A.map((systemId) =>
        airtable
          .base(systemFromId(systemId)?.airtableId ?? "")
          .table("space_type")
          .select()
          .all()
          .then(
            z.array(
              spaceTypeParser.transform(
                ({ id, fields: { space_code, description, image } }) => ({
                  id,
                  systemId,
                  code: space_code,
                  description,
                })
              )
            ).parse
          )
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
