import { sum } from "fp-ts-std/Array"
import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import { trpc } from "@/client/trpc"
import { Module, StructuredDna } from "../../server/data/modules"
import { StairType } from "../../server/data/stairTypes"
import { useGetVanillaModule } from "../design/state/vanilla"
import { A, Num, O, Ord, R, SG } from "~/utils/functions"
import { abs, hamming } from "~/utils/math"

export const useModules = (): Module[] => {
  const { data = [] } = trpc.modules.useQuery()

  return data as Module[]
}

export const useSystemModules = ({
  systemId,
}: {
  systemId: string
}): Module[] => {
  return useModules().filter((x) => x.systemId === systemId)
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

export const filterCompatibleModules =
  (
    ks: Array<keyof StructuredDna> = [
      "sectionType",
      "positionType",
      "levelType",
      "gridType",
    ]
  ) =>
  (moduleA: Module) =>
    A.filter(
      (moduleB: Module) =>
        moduleB.systemId === moduleA.systemId &&
        ks.reduce(
          (acc: boolean, k) =>
            acc && moduleB.structuredDna[k] === moduleA.structuredDna[k],
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
