import Airtable from "airtable"
import { QueryParams } from "airtable/lib/query_params"
import { sum } from "fp-ts-std/Array"
import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import { proxy, ref, useSnapshot } from "valtio"
import * as z from "zod"
import { useGetVanillaModule } from "../hooks/vanilla"
import { A, Num, O, Ord, R, SG } from "../utils/functions"
import { abs, hamming } from "../utils/math"
import { trpc } from "../utils/trpc"
import { StairType } from "./stairTypes"
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
      GLB_model: z.array(
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
        GLB_model,
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
      glbUrl: GLB_model[0].url,
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
  glbUrl: string
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

const systemModules = proxy<Record<string, Module[]>>({})

export const useSystemModules = ({ systemId }: { systemId: string }) => {
  const snap = useSnapshot(systemModules) as typeof systemModules
  return snap?.[systemId] ?? []
}

export const useAllSystemModules = () => useSnapshot(systemModules)

export const useInitSystemModules = ({ systemId }: { systemId: string }) => {
  trpc.systemModules.useQuery(
    {
      systemId: systemId,
    },
    {
      onSuccess: (data) => {
        systemModules[systemId] = ref(data)
      },
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  )
  return useSystemModules({ systemId })
}

export const usePadColumn = (systemId: string) => {
  const getVanillaModule = useGetVanillaModule(systemId)

  return (levels: Module[][]) => {
    const target = pipe(
      levels,
      A.reduce(0, (b, level) => {
        const x = pipe(
          level,
          A.reduce(0, (c, m) => c + m.structuredDna.gridUnits)
        )
        return x > b ? x : b
      })
    )

    return pipe(
      levels,
      A.map((level) => {
        const levelLength = level.reduce(
          (acc, v) => acc + v.structuredDna.gridUnits,
          0
        )
        return [
          ...level,
          ...A.replicate(target - levelLength, getVanillaModule(level[0])),
        ]
      })
    )
  }
}

export const useGetStairsModule = (systemId: string) => {
  // const { modules: allModules } = useSystemsData()
  const systemModules = useSystemModules({ systemId })

  return (
    oldModule: Module,
    opts: {
      stairsType?: StairType["code"]
      levelType?: string
    } = {}
  ) => {
    const { stairsType, levelType } = opts
    const constraints = keysFilter(
      ["sectionType", "positionType", "gridType"],
      oldModule
    )

    return pipe(
      systemModules as unknown as Module[],
      A.filter(constraints),
      A.filter(
        (x) =>
          x.structuredDna.stairsType ===
            (stairsType ?? oldModule.structuredDna.stairsType) &&
          (!levelType
            ? x.structuredDna.levelType === oldModule.structuredDna.levelType
            : x.structuredDna.levelType === levelType)
      ),
      topCandidateByHamming(oldModule, [
        "internalLayoutType",
        "windowTypeSide1",
        "windowTypeSide2",
        "windowTypeEnd",
        "windowTypeTop",
      ])
    )
  }
}

export const filterCompatibleModules =
  (
    ks: Array<keyof StructuredDna> = [
      "sectionType",
      "positionType",
      "levelType",
      "gridType",
    ]
  ) =>
  (module: Module) =>
    A.filter((m: Module) =>
      ks.reduce(
        (acc: boolean, k) =>
          acc && m.structuredDna[k] === module.structuredDna[k],
        true
      )
    )

export const keysFilter =
  (ks: Array<keyof StructuredDna>, targetModule: Module) => (m: Module) =>
    ks.reduce(
      (acc: boolean, k) =>
        acc && m.structuredDna[k] === targetModule.structuredDna[k],
      true
    )

export const keysHamming =
  (ks: Array<keyof StructuredDna>) => (a: Module, b: Module) =>
    pipe(
      ks,
      A.map((k): [string, number] => {
        switch (typeof a.structuredDna[k]) {
          case "string":
            return [
              k,
              hamming(
                a.structuredDna[k] as string,
                b.structuredDna[k] as string
              ),
            ]
          case "number":
            return [
              k,
              abs(
                (a.structuredDna[k] as number) - (b.structuredDna[k] as number)
              ),
            ]
          default:
            throw new Error(
              `structuredDna key ${k} type ${typeof a.structuredDna[k]} `
            )
        }
      }),
      R.fromFoldable(SG.first<number>(), A.Foldable)
    )
export const keysHammingTotal =
  (ks: Array<keyof StructuredDna>) => (a: Module, b: Module) =>
    pipe(keysHamming(ks)(a, b), values, sum)

export const topCandidateByHamming =
  (
    targetModule: Module,
    ks: Array<keyof StructuredDna> = [
      "gridUnits",
      "internalLayoutType",
      "stairsType",
      "windowTypeEnd",
      "windowTypeSide1",
      "windowTypeSide2",
      "windowTypeTop",
    ]
  ) =>
  (candidateModules: Module[]): O.Option<Module> =>
    pipe(
      candidateModules,
      A.map((m): [Module, number] => [
        m,
        keysHammingTotal(ks)(targetModule, m),
      ]),
      A.sort(
        pipe(
          Num.Ord,
          Ord.contramap(([, n]: [Module, number]) => n)
        )
      ),
      A.head,
      O.map(([m]) => m)
    )
export default systemModules
