import { Module } from "@/server/data/modules"
import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import { proxy } from "valtio"
import { A, all, O, Ord, RA, S, someOrError } from "~/utils/functions"
import { useSystemModules } from "../../data/modules"
import layoutsDB, {
  getVanillaColumnsKey,
  PositionedRow,
  VanillaColumn,
} from "../../db/layouts"
import { isSSR } from "../../utils/next"

export const vanillaModules = proxy<Record<string, string>>({})

export const vanillaColumns = proxy<Record<string, VanillaColumn>>({})

export const getVanillaModulesKey = ({
  systemId,
  sectionType,
  positionType,
  levelType,
  gridType,
}: {
  systemId: string
  sectionType: string
  positionType: string
  levelType: string
  gridType: string
}) => [systemId, sectionType, positionType, levelType, gridType].toString()

if (!isSSR()) {
  liveQuery(() => layoutsDB.vanillaModules.toArray()).subscribe(
    (dbVanillaModules) => {
      for (let { moduleDna, ...dbVanillaModule } of dbVanillaModules) {
        vanillaModules[getVanillaModulesKey(dbVanillaModule)] = moduleDna
      }
    }
  )
}

if (!isSSR()) {
  liveQuery(() => layoutsDB.vanillaColumns.toArray()).subscribe(
    (dbVanillaColumns) => {
      for (let { systemId, levelTypes, vanillaColumn } of dbVanillaColumns) {
        const vanillaColumnsKey = getVanillaColumnsKey({
          systemId,
          sectionType: "",
          levelTypes,
        })
        vanillaColumns[vanillaColumnsKey] = vanillaColumn
      }
    }
  )
}

export const getVanillaColumnLength = (column: PositionedRow[]) =>
  pipe(
    column,
    A.head,
    O.map((row) => row.rowLength),
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
      A.filter((sysModule) =>
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
      A.sort(
        pipe(
          S.Ord,
          Ord.contramap((m: Module) => m.dna)
        )
      ),
      A.head,
      O.toNullable
    )

    if (!vanillaModule)
      throw new Error(`No vanilla module found for ${module.dna}`)

    return vanillaModule
  }
}
