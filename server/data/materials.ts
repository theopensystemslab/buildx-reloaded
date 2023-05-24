import { pipe } from "fp-ts/lib/function"
import { MeshStandardMaterial } from "three"
import * as z from "zod"
import { systemFromId } from "@/server/data/system"
import { A } from "~/utils/functions"
import { QueryFn } from "./types"
import { QueryParams } from "airtable/lib/query_params"

export interface Material {
  id: string
  systemId: string
  specification: string
  defaultFor: Array<string>
  optionalFor: Array<string>
  imageUrl: string
  defaultColor: string
  costPerUnit: number
  embodiedCarbonPerUnit: number // kg
  threeMaterial?: MeshStandardMaterial
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
