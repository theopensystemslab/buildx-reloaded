import { pipe } from "fp-ts/lib/function"
import { proxy } from "valtio"
import { Module, useSystemModules } from "../data/modules"
import { A, all, O, Ord, RA, S, someOrError } from "../utils/functions"
import { PositionedRow } from "./layouts"

export const vanillaColumns = proxy<Record<string, PositionedRow[]>>({})

export const getVanillaColumnLength = (column: PositionedRow[]) =>
  pipe(
    column,
    A.head,
    O.map((row) => row.length),
    someOrError(`getVanillaColumnLength column of 0 height`)
  )

export const useGetVanillaModule = (systemId: string) => {
  const systemModules = useSystemModules({ systemId })

  if (!systemModules) throw new Error("No modules")

  return (
    module: Module,
    opts: {
      positionType?: string
      levelType?: string
      constrainGridType?: boolean
      sectionType?: string
    } = {}
  ): Module => {
    const {
      sectionType,
      positionType,
      levelType,
      constrainGridType = true,
    } = opts

    const vanillaModule = pipe(
      systemModules,
      RA.filter((sysModule) =>
        all(
          sectionType
            ? sysModule.structuredDna.sectionType === sectionType
            : sysModule.structuredDna.sectionType ===
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
      O.toNullable
    )

    if (!vanillaModule)
      throw new Error(`No vanilla module found for ${module.dna}`)

    return vanillaModule
  }
}
