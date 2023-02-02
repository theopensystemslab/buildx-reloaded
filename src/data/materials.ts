// import type { Material } from "./material"
// import { getField, getAirtableEntries } from "./utils"
// import { includes } from "ramda"
import { systemFromId } from "@/data/system"
import Airtable from "airtable"
import { identity, pipe } from "fp-ts/lib/function"
import { MeshBasicMaterial, MeshStandardMaterial } from "three"
import { proxy, ref, useSnapshot } from "valtio"
import * as z from "zod"
import houses, { useHouse } from "../hooks/houses"
import { errorThrower, O, RA, someOrError } from "../utils/functions"
import { createMaterial } from "../utils/three"
import { trpc } from "../utils/trpc"
import { useSystemElements } from "./elements"

export interface Material {
  id: string
  systemId: string
  name: string
  defaultFor: Array<string>
  optionalFor: Array<string>
  imageUrl: string
  defaultColor: string
  costPerM2: number
  embodiedCarbonPerM2: number // kg
  threeMaterial?: MeshStandardMaterial
}

// elements requires materials first

export const materialParser = z
  .object({
    id: z.string().min(1),
    fields: z.object({
      name: z.string().min(1).default(""),
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
      material_cost_per_m2: z.number().default(0),
      embodied_carbon_cost_per_m2: z.number().default(0),
    }),
  })
  .transform(
    ({
      id,
      fields: {
        name,
        default_material_for,
        optional_material_for,
        material_image,
        default_colour,
        material_cost_per_m2,
        embodied_carbon_cost_per_m2,
      },
    }) => ({
      id,
      name,
      defaultFor: default_material_for ?? [],
      optionalFor: optional_material_for ?? [],
      imageUrl: material_image?.[0]?.url,
      defaultColor: default_colour,
      costPerM2: material_cost_per_m2,
      embodiedCarbonPerM2: embodied_carbon_cost_per_m2,
    })
  )

export const materialsQuery =
  (airtable: Airtable) =>
  ({
    input: { systemId },
  }: {
    input: { systemId: string }
  }): Promise<Material[]> =>
    pipe(
      airtable
        .base(systemFromId(systemId)?.airtableId ?? "")
        .table("materials_menu")
        .select()
        .all()
        .then(
          z.array(materialParser.transform((xs) => ({ ...xs, systemId }))).parse
        )
    )

// export const useSystemMaterials = ({ systemId }: { systemId: string }) =>
//   trpc.systemMaterials.useQuery({
//     systemId,
//   })

const materials = proxy<Record<string, Material[]>>({})

export const useSystemMaterials = ({ systemId }: { systemId: string }) => {
  const snap = useSnapshot(materials) as typeof materials
  return snap?.[systemId] ?? []
}

export const useInitSystemMaterials = ({ systemId }: { systemId: string }) => {
  trpc.systemMaterials.useQuery(
    {
      systemId: systemId,
    },
    {
      onSuccess: (data) => {
        materials[systemId] = data
        materials[systemId].forEach((material) => {
          material.threeMaterial = ref(createMaterial(material))
        })
      },
    }
  )
  return useSystemMaterials({ systemId })
}
