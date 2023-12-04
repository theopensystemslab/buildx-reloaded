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
  const currentDna = parseDna(dna)

  const dnaSide = side === "LEFT" ? "windowTypeSide1" : "windowTypeSide2"

  console.log(`INVOKED ON SIDE: ${side}; ${dnaSide}`)

  const {
    levelType,
    positionType,
    gridType,
    gridUnits,
    windowTypeSide1,
    windowTypeSide2,
    windowTypeTop,
    windowTypeEnd,
  } = currentDna

  console.log(
    `CURRENT: ${dna}`
    // `CURRENT: ${gridType}-${gridUnits}-${windowTypeSide1}-${windowTypeSide2}`
  )

  return pipe(
    () => getModules(),
    T.map((looseCandidates) =>
      pipe(
        looseCandidates,
        A.filter((candidate) => {
          let check =
            candidate.systemId === systemId &&
            candidate.dna !== dna &&
            compareProps(candidate.structuredDna, currentDna, [
              "sectionType",
              "positionType",
              "levelType",
              "gridType",
            ])

          if (!check) return false

          if (positionType === "END") {
            return candidate.structuredDna.windowTypeEnd !== windowTypeEnd
          }

          if (levelType[0] === "R") {
            const bool = candidate.structuredDna.windowTypeTop !== windowTypeTop
            if (bool) {
              console.log(`CANDIDATE: ${candidate.dna}`)
            }
            return bool
          }

          // const k: keyof typeof parsedStructuredDna =
          //   side === "LEFT" ? "windowTypeSide2" : "windowTypeSide1"

          const bool =
            side === "RIGHT"
              ? compareProps(candidate.structuredDna, currentDna, [
                  "windowTypeEnd",
                  "windowTypeTop",
                  "windowTypeSide1",
                ]) &&
                candidate.structuredDna.windowTypeSide2 !==
                  currentDna.windowTypeSide2
              : compareProps(candidate.structuredDna, currentDna, [
                  "windowTypeEnd",
                  "windowTypeTop",
                  "windowTypeSide2",
                ]) &&
                candidate.structuredDna.windowTypeSide1 !==
                  currentDna.windowTypeSide1

          if (bool) {
            const { gridType, gridUnits, windowTypeSide1, windowTypeSide2 } =
              candidate.structuredDna
            console.log(
              `CANDIDATE: ${candidate.dna}`
              // `CANDIDATE: ${gridType}-${gridUnits}-${windowTypeSide1}-${windowTypeSide2}`
            )
          }

          return bool
        })
      )
    )
  )
}
