import Airtable from "airtable"
import { QueryParams } from "airtable/lib/query_params"
import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { systemFromId } from "./system"

export const moduleSelector: QueryParams<any> = {
  filterByFormula: 'IFC_model!=""',
}

export type StructuredDna = {
  level: number
  levelType: string
  positionType: "END" | "MID"
  sectionType: string
  gridType: string
  gridUnits: number
  stairsType: string
  internalLayoutType: string
  windowTypeSide1: string
  windowTypeSide2: string
  windowTypeEnd: string
  windowTypeTop: string
}

export const parseDna = (dna: string): StructuredDna => {
  const chunks = dna.split("-")
  const levelType = chunks[2]
  const levelLetter = chunks[2]?.[0]
  const typeLetter = chunks[1]?.[0]?.toUpperCase()
  const sectionType = chunks[0] ?? "S1"
  const gridType = chunks[3] ?? "GRID1"
  const gridUnits = Number(chunks[4]) ?? 1
  const stairsType = chunks[5] ?? "ST0"
  const internalLayoutType = chunks[6] ?? "L0"
  const windowTypeSide1 = chunks[7] ?? "SIDE0"
  const windowTypeSide2 = chunks[8] ?? "SIDE0"
  const windowTypeEnd = chunks[9] ?? "END0"
  const windowTypeTop = chunks[10] ?? "TOP0"

  return {
    positionType: typeLetter === "E" ? "END" : "MID",
    level: ["F", "G", "M", "T", "R"].indexOf(levelLetter),
    levelType,
    sectionType,
    gridType,
    gridUnits,
    stairsType,
    internalLayoutType,
    windowTypeSide1,
    windowTypeSide2,
    windowTypeEnd,
    windowTypeTop,
  }
}

export const moduleParser = z
  .object({
    id: z.string().min(1),
    fields: z.object({
      module_code: z.string().min(1),
      IFC_model: z.array(
        z.object({
          url: z.string().min(1),
        })
      ),
      section_width: z.array(z.number()),
      level_height: z.array(z.number()),
      length_dims: z.number(),
      floor_area: z.number(),
      roofing_area: z.number(),
      space_type: z.array(z.string().optional()).optional(),
      baseline_module_cost: z.number().optional(),
      embodied_carbon: z.number().optional(),
      visual_reference: z
        .array(z.object({ url: z.string().optional() }).optional())
        .optional(),
      description: z.string().optional(),
    }),
  })
  .transform(
    ({
      id,
      fields: {
        module_code,
        IFC_model,
        section_width: [width],
        level_height: [height],
        length_dims: length,
        floor_area: floorArea,
        roofing_area: roofingArea,
        space_type,
        baseline_module_cost,
        embodied_carbon,
        visual_reference,
        description,
      },
    }) => ({
      id,
      dna: module_code,
      ifcUrl: IFC_model[0].url,
      structuredDna: parseDna(module_code),
      length,
      height,
      width,
      floorArea,
      claddingArea: floorArea,
      liningArea: floorArea,
      roofingArea,
      spaceType: space_type?.[0],
      cost: baseline_module_cost ?? 1500,
      embodiedCarbon: embodied_carbon ?? -400,
      description,
      visualReference: visual_reference?.[0]?.url,
    })
  )

export type Module = {
  id: string
  systemId: string
  dna: string
  structuredDna: StructuredDna
  ifcUrl: string
  width: number
  height: number
  length: number
  cost: number // Euros
  floorArea: number
  claddingArea: number
  liningArea: number
  roofingArea: number
  spaceType?: string
  embodiedCarbon: number // kgCO2
  visualReference?: string
  description?: string
}

export const modulesQuery =
  (airtable: Airtable) =>
  ({
    input: { systemId },
  }: {
    input: { systemId: string }
  }): Promise<Module[]> =>
    pipe(
      airtable
        .base(systemFromId(systemId)?.airtableId ?? "")
        .table("modules")
        .select(moduleSelector)
        .all()
        .then(
          z.array(moduleParser.transform((xs) => ({ ...xs, systemId }))).parse
        )
    )
