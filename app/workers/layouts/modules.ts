import { pipe } from "fp-ts/lib/function"
import { Module, parseDna } from "../../../server/data/modules"
import systemsDB, { LastFetchStamped } from "../../db/systems"
import { A, compareProps } from "../../utils/functions"
import { Side } from "../../design/state/camera"

let modulesCache: LastFetchStamped<Module>[] = []

export const getModules = async () => {
  if (modulesCache.length > 0) return modulesCache
  modulesCache = await systemsDB.modules.toArray()
  return modulesCache
}

export const getWindowTypeAlternatives = async ({
  systemId,
  dna,
  side,
}: {
  systemId: string
  dna: string
  side: Side
}) => {
  const allModules = await getModules()

  const parsedStructuredDna = parseDna(dna)
  const { levelType, positionType, windowTypeTop, windowTypeEnd } =
    parsedStructuredDna

  const looseCandidates = pipe(
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
        ])
    )
  )
  switch (true) {
    // top openings
    case levelType[0] === "R": {
      return pipe(
        looseCandidates,
        A.filter((x) => x.structuredDna.windowTypeTop !== windowTypeTop)
      )
    }

    // end openings
    case positionType === "END": {
      return pipe(
        looseCandidates,
        A.filter((x) => x.structuredDna.windowTypeEnd !== windowTypeEnd)
      )
    }

    // left/right side openings
    default: {
      const k: keyof typeof parsedStructuredDna =
        side === "LEFT" ? "windowTypeSide2" : "windowTypeSide1"

      // might need to constrain harder here? or not?

      return pipe(
        looseCandidates,
        A.filter((x) => x.structuredDna[k] !== parsedStructuredDna[k])
      )
    }
  }
}
