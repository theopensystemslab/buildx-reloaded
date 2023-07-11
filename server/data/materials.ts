import { systemFromId } from "@/server/data/system"
import { QueryParams } from "airtable/lib/query_params"
import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { A } from "~/utils/functions"
import { QueryFn } from "./types"

export interface Material {
  id: string
  systemId: string
  specification: string
  defaultFor: Array<string>
  optionalFor: Array<string>
  imageUrl: string
  linkUrl?: string
  defaultColor: string
  costPerUnit: number
  embodiedCarbonPerUnit: number // kg
  unit: string | null
  lastModified: number
}

export const materialSelector: QueryParams<any> = {
  // filterByFormula: 'OR(IFC_model!="",GLB_model!="")',
  filterByFormula: 'AND(specification!="", default_colour!="")',
}

export const materialParser = z
  .object({
    id: z.string().min(1),
    fields: z.object({
      specification: z.string().min(1),
      default_material_for: z.array(z.string().min(1)).default([]),
      optional_material_for: z.array(z.string().min(1)).default([]),
      default_colour: z.string().min(1).default(""),
      material_image: z
        .array(
          z.object({
            url: z.string().min(1),
          })
        )
        .default([]),
      material_cost_per_unit: z.number().default(0),
      embodied_carbon_cost_per_unit: z.number().default(0),
      link_url: z.string().optional(),
      unit: z.string().nullable().default(null),
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
  .transform(
    ({
      id,
      fields: {
        specification,
        default_material_for,
        optional_material_for,
        material_image,
        default_colour,
        material_cost_per_unit,
        embodied_carbon_cost_per_unit,
        link_url,
        unit,
        last_modified,
      },
    }) => ({
      id,
      specification,
      defaultFor: default_material_for ?? [],
      optionalFor: optional_material_for ?? [],
      imageUrl: material_image?.[0]?.url,
      defaultColor: default_colour,
      costPerUnit: material_cost_per_unit,
      embodiedCarbonPerUnit: embodied_carbon_cost_per_unit,
      linkUrl: link_url,
      unit,
      lastModified: last_modified,
    })
  )

export const materialsQuery: QueryFn<Material> =
  (airtable) =>
  ({ input: { systemIds } }) =>
    pipe(
      systemIds,
      A.map((systemId) =>
        pipe(
          airtable
            .base(systemFromId(systemId)?.airtableId ?? "")
            .table("materials_menu")
            .select(materialSelector)
            .all()
            .then(
              z.array(materialParser.transform((xs) => ({ ...xs, systemId })))
                .parse
            )
        )
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
