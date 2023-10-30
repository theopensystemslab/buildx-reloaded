import { pipe } from "fp-ts/lib/function"
import { Module, parseDna } from "../../../server/data/modules"
import systemsDB, { LastFetchStamped } from "../../db/systems"
import { Side } from "../../design/state/camera"
import { A, T, compareProps } from "../../utils/functions"

let modulesCache: LastFetchStamped<Module>[] = []

export const getModules = async () => {
  if (modulesCache.length > 0) return modulesCache
  modulesCache = await systemsDB.modules.toArray()
  return modulesCache
}

export const getModuleWindowTypeAlts = ({
  systemId,
  dna,
  side,
}: {
  systemId: string
  dna: string
  side: Side
}): T.Task<LastFetchStamped<Module>[]> => {
  const parsedStructuredDna = parseDna(dna)
  const { levelType, positionType, windowTypeTop, windowTypeEnd } =
    parsedStructuredDna

  return pipe(
    () => getModules(),
    T.map((looseCandidates) =>
      pipe(
        looseCandidates,
        A.filter((x) => {
          let check =
            x.systemId === systemId &&
            x.dna !== dna &&
            compareProps(x.structuredDna, parsedStructuredDna, [
              "sectionType",
              "positionType",
              "levelType",
              "gridType",
            ])

          if (!check) return false

          if (positionType === "END")
            return x.structuredDna.windowTypeEnd !== windowTypeEnd

          if (levelType[0] === "R")
            return x.structuredDna.windowTypeTop !== windowTypeTop

          const k: keyof typeof parsedStructuredDna =
            side === "LEFT" ? "windowTypeSide2" : "windowTypeSide1"

          return x.structuredDna[k] !== parsedStructuredDna[k]
        })
        // pipeLogWith((alts) => ({ alts: alts.map((x) => x.dna), original: dna }))
      )
    )
  )
}
