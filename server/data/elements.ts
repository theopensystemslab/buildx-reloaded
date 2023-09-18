import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { systemFromId } from "@/server/data/system"
import { A } from "~/utils/functions"
import { materialsQuery } from "./materials"
import { QueryFn } from "./types"

export type Element = {
  id: string
  systemId: string
  name: string
  ifcTag: string
  defaultMaterial: string
  materialOptions: Array<string>
  category: string
  lastModified: number
}

export const elementParser = z.object({
  id: z.string().min(1),
  fields: z.object({
    element_code: z
      .string()
      .min(1)
      .transform((s) => s.trim()),
    ifc4_variable: z.string().min(1),
    default_material: z.array(z.string().min(1)).optional(),
    element_category: z.string().min(1),
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

export const elementsQuery: QueryFn<Element> =
  (airtable) =>
  async ({ input: { systemIds } }) => {
    const materials = await materialsQuery(airtable)({ input: { systemIds } })

    return pipe(
      systemIds,
      A.map((systemId) =>
        pipe(
          airtable
            .base(systemFromId(systemId)?.airtableId ?? "")
            .table("building_elements")
            .select()
            .all()
            .then(
              z.array(
                elementParser.transform(
                  ({
                    id,
                    fields: {
                      element_code,
                      ifc4_variable,
                      element_category,
                      last_modified,
                    },
                  }) => {
                    const defaultMaterials = materials.filter(
                      ({ defaultFor }) => defaultFor.includes(id)
                    )
                    const optionalMaterials = materials.filter(
                      ({ optionalFor }) => optionalFor.includes(id)
                    )
                    const defaultMaterial =
                      defaultMaterials[0]?.specification ||
                      optionalMaterials[0]?.specification ||
                      ""
                    const materialOptions = optionalMaterials.map(
                      (material) => material.specification
                    )

                    return {
                      id,
                      systemId,
                      name: element_code,
                      ifcTag: ifc4_variable.toUpperCase(),
                      defaultMaterial,
                      materialOptions,
                      category: element_category,
                      lastModified: last_modified,
                    }
                  }
                )
              ).parse
            )
        )
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
  }
