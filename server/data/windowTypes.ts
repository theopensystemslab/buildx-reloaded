import * as z from "zod"
import Airtable from "airtable"
import { pipe } from "fp-ts/lib/function"
import { systemFromId } from "./system"
import { proxy, useSnapshot } from "valtio"
import { trpc } from "../../src/utils/trpc"

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

export const windowTypesQuery =
  (airtable: Airtable) =>
  async ({
    input: { systemId },
  }: {
    input: { systemId: string }
  }): Promise<WindowType[]> =>
    pipe(
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
    )
