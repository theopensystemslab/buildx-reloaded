import * as z from "zod"
import { pipe } from "fp-ts/lib/function"
import { A } from "~/utils/functions"
import { QueryFn } from "./types"
import { systemFromId } from "./system"

type ClampedDimension = {
  min: number
  max: number
  units: string
}

export interface SystemSettings {
  systemId: string
  length: ClampedDimension
  height: ClampedDimension
}

export const systemSettingsParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    Field: z.string().min(1),
    units: z.string().min(1),
    minimum: z.number(),
    maximum: z.number(),
  }),
})

export const systemSettingsQuery: QueryFn<SystemSettings> =
  (airtable) =>
  async ({ input: { systemIds } }) =>
    pipe(
      systemIds,
      A.map((systemId) =>
        airtable
          .base(systemFromId(systemId)?.airtableId ?? "")
          .table("system_settings")
          .select()
          .all()
          .then((res) => {
            const parsley = z
              .array(
                systemSettingsParser.transform(
                  ({ id, fields: { Field, units, minimum, maximum } }) => ({
                    id,
                    Field,
                    minimum,
                    maximum,
                    units,
                  })
                )
              )
              .parse(res)

            const bar = parsley.reduce(
              (acc, { Field, units, minimum, maximum }) => ({
                ...acc,
                systemId,
                [Field]: {
                  units,
                  minimum,
                  maximum,
                },
              }),
              {} as SystemSettings
            )

            return bar
          })
      ),
      (ps) => Promise.all(ps)
    )
