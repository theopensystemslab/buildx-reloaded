import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { systemFromId } from "~/server/data/system"
import { A } from "../../src/utils/functions"
import { materialsQuery } from "./materials"
import { QueryFn } from "./types"

export type Element = {
  id: string
  systemId: string
  name: string
  ifc4Variable: string
  defaultMaterial: string
  materialOptions: Array<string>
  category: string
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
                    fields: { element_code, ifc4_variable, element_category },
                  }) => {
                    const defaultMaterials = materials.filter(
                      ({ defaultFor }) => defaultFor.includes(id)
                    )
                    const optionalMaterials = materials.filter(
                      ({ optionalFor }) => optionalFor.includes(id)
                    )
                    const defaultMaterial =
                      defaultMaterials[0]?.name ||
                      optionalMaterials[0]?.name ||
                      ""
                    const materialOptions = optionalMaterials.map(
                      (material) => material.name
                    )
                    return {
                      id,
                      systemId,
                      name: element_code,
                      ifc4Variable: ifc4_variable,
                      defaultMaterial,
                      materialOptions,
                      category: element_category,
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
