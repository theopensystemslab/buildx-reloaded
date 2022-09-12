import { pipe } from "fp-ts/lib/function"
import { Module } from "../data/module"
import { trpc } from "../utils/trpc"
import * as RA from "fp-ts/ReadonlyArray"
import * as Ord from "fp-ts/Ord"
import * as S from "fp-ts/string"
import * as O from "fp-ts/Option"
import * as A from "fp-ts/Array"
import { all } from "../utils/functions"
import { toNullable } from "fp-ts/lib/Option"

export const useSystemModules = ({ systemId }: { systemId: string }) =>
  trpc.systemModules.useQuery({
    systemId: systemId,
  })

export const useGetVanillaModule = (systemId: string) => {
  const { data: allModules } = useSystemModules({ systemId })

  if (!allModules) throw new Error("No modules")

  return (
    module: Module,
    opts: {
      positionType?: string
      levelType?: string
      constrainGridType?: boolean
    } = {}
  ) => {
    const { positionType, levelType, constrainGridType = true } = opts

    const systemModules = pipe(
      allModules,
      RA.filter((m) => m.systemId === module.systemId)
    )

    const vanillaModule = pipe(
      systemModules,
      RA.filter((sysModule) =>
        all(
          sysModule.structuredDna.sectionType ===
            module.structuredDna.sectionType,
          positionType
            ? sysModule.structuredDna.positionType === positionType
            : sysModule.structuredDna.positionType ===
                module.structuredDna.positionType,
          levelType
            ? sysModule.structuredDna.levelType === levelType
            : sysModule.structuredDna.levelType ===
                module.structuredDna.levelType,
          !constrainGridType ||
            sysModule.structuredDna.gridType === module.structuredDna.gridType
        )
      ),
      RA.sort(
        pipe(
          S.Ord,
          Ord.contramap((m: Module) => m.dna)
        )
      ),
      RA.head,
      toNullable
    )

    if (!vanillaModule)
      throw new Error(`No vanilla module found for ${module.dna}`)

    return vanillaModule
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
