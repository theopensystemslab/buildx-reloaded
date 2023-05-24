import { QueryParams } from "airtable/lib/query_params"
import { pipe } from "fp-ts/lib/function"
import * as z from "zod"
import { A, O, R, S } from "~/utils/functions"
import { useWindowTypes } from "../../app/data/windowTypes"
import { systemFromId } from "./system"
import { QueryFn } from "./types"
import { WindowType } from "./windowTypes"

export const moduleSelector: QueryParams<any> = {
  // filterByFormula: 'OR(IFC_model!="",GLB_model!="")',
  // filterByFormula: 'GLB_model!=""',
  filterByFormula: 'speckle_branch_url!=""',
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
      speckle_branch_url: z.string().min(1),
      section_width: z.array(z.number()),
      level_height: z.array(z.number()),
      length_dims: z.number().default(0),
      floor_area: z.number().default(0),
      cladding_area: z.number().default(0),
      lining_area: z.number().default(0),
      roofing_area: z.number().default(0),
      concrete_volume: z.number().default(0),
      flashing_area: z.number().default(0),
      gutter_length: z.number().default(0),
      downpipe_length: z.number().default(0),
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
        speckle_branch_url,
        section_width: [width],
        level_height: [height],
        length_dims: length,
        floor_area: floorArea,
        cladding_area: claddingArea,
        lining_area: liningArea,
        roofing_area: roofingArea,
        concrete_volume: concreteVolume,
        length_dims: lengthDims,
        flashing_area: flashingArea,
        gutter_length: gutterLength,
        downpipe_length: downpipeLength,
        space_type,
        baseline_module_cost,
        embodied_carbon,
        visual_reference,
        description,
      },
    }) => ({
      id,
      dna: module_code,
      speckleBranchUrl: speckle_branch_url,
      structuredDna: parseDna(module_code),
      length,
      height,
      width,
      floorArea,
      claddingArea,
      liningArea,
      roofingArea,
      concreteVolume,
      lengthDims,
      flashingArea,
      gutterLength,
      downpipeLength,
      spaceType: space_type?.[0] ?? "NONE",
      cost: baseline_module_cost ?? 1500,
      embodiedCarbon: embodied_carbon ?? -400,
      description,
      visualReference: visual_reference?.[0]?.url,
    })
  )

export type Module = { systemId: string } & z.infer<typeof moduleParser>

export const modulesQuery: QueryFn<Module> =
  (airtable) =>
  ({ input: { systemIds } }) => {
    return pipe(
      systemIds,
      A.map((systemId) =>
        pipe(
          airtable
            .base(systemFromId(systemId)?.airtableId ?? "")
            .table("modules")
            .select(moduleSelector)
            .all()
            .then(
              z.array(moduleParser.transform((xs) => ({ ...xs, systemId })))
                .parse
            )
        )
      ),
      (ps) => Promise.all(ps).then(A.flatten)
    )
  }

export const useGetModuleWindowTypes = () => {
  const windowTypes = useWindowTypes()

  return (module: Module) =>
    pipe(
      module.structuredDna,
      R.reduceWithIndex(S.Ord)([], (key, acc: WindowType[], value) => {
        switch (key) {
          case "windowTypeEnd":
          case "windowTypeSide1":
          case "windowTypeSide2":
          case "windowTypeTop":
            return pipe(
              windowTypes,
              A.findFirstMap((wt) =>
                wt.code === value ? O.some([...acc, wt]) : O.none
              ),
              O.getOrElse(() => acc)
            )
          default:
            return acc
        }
      })
    )
}
