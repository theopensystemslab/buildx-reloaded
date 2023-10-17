import { pipe } from "fp-ts/lib/function"
import { Module, parseDna } from "../../../server/data/modules"
import systemsDB, { LastFetchStamped } from "../../db/systems"
import { A, compareProps } from "../../utils/functions"

let modulesCache: LastFetchStamped<Module>[] = []

export const getModules = async () => {
  if (modulesCache.length > 0) return modulesCache
  modulesCache = await systemsDB.modules.toArray()
  return modulesCache
}

export const getWindowTypeAlternatives = async ({
  systemId,
  dna,
}: {
  systemId: string
  dna: string
}) => {
  const allModules = await getModules()

  const parsedStructuredDna = parseDna(dna)

  return pipe(
    allModules,
    A.filter(
      (x) =>
        x.systemId === systemId &&
        x.dna !== dna &&
        compareProps(x.structuredDna, parsedStructuredDna, [
          "sectionType",
          "positionType",
          "levelType",
          "gridType",
          // "gridUnits",
          // "stairsType",
          // "internalLayoutType",
        ])
    )
  )
}
