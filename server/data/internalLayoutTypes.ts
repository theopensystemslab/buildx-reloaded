import * as z from "zod"
import { pipe } from "fp-ts/lib/function"
import { systemFromId } from "./system"
import { QueryFn } from "./types"
import { A } from "@/utils/functions"

export interface InternalLayoutType {
  id: string
  systemId: string
  code: string
  description: string
}

export const internalLayoutTypeParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    internal_layout_code: z.string().min(1),
    description: z.string().min(1),
  }),
})

export const internalLayoutTypesQuery: QueryFn<InternalLayoutType> =
  (airtable) =>
  async ({ input: { systemIds } }) =>
    pipe(
      systemIds,
      A.map((systemId) =>
        airtable
          .base(systemFromId(systemId)?.airtableId ?? "")
          .table("internal_layout_type")
          .select()
          .all()
          .then(
            z.array(
              internalLayoutTypeParser.transform(
                ({ id, fields: { internal_layout_code, description } }) => ({
                  id,
                  systemId,
                  code: internal_layout_code,
                  description,
                })
              )
            ).parse
          )
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
