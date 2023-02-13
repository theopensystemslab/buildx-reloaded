import { transpose } from "fp-ts-std/Array"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import { useInitSystemLevelTypes } from "../../data/levelTypes"
import {
  filterCompatibleModules,
  keysFilter,
  Module,
  topCandidateByHamming,
  usePadColumn,
  useSystemModules,
} from "../../data/modules"
import { A, O, Ord, S } from "../../utils/functions"
import houses from "../houses"
import { columnMatrixToDna } from "../layouts"
import {
  getSelectedColumnMatrix,
  getSelectedLevelModules,
  getSelectedLevelType,
  getSelectedModule,
  useScope,
} from "../scope"

export type LevelTypeOption = {
  label: string
  value: { levelType: string; houseDna: string[] }
}

export const useChangeLevelType = ({ systemId }: { systemId: string }) => {
  const { selected } = useScope()
  if (selected === null) throw new Error("null selected")

  const padColumn = usePadColumn(systemId)

  const systemModules = useSystemModules({ systemId })

  const { houseId, levelIndex } = selected

  const systemLevelTypes = useInitSystemLevelTypes({ systemId })

  const levelTypes = pipe(
    systemLevelTypes,
    A.filter((lt) => lt.systemId === systemId)
  )

  const getDescription = (levelType: string) =>
    pipe(
      levelTypes,
      A.findFirstMap((lt) =>
        lt.code === levelType ? O.some(lt.description) : O.none
      ),
      O.getOrElse(() => "")
    )

  const thisModule = getSelectedModule()
  const thisLevelType = getSelectedLevelType()
  const thisLevel = getSelectedLevelModules()
  const columnMatrix = getSelectedColumnMatrix()

  if (!thisModule || !thisLevelType || !thisLevel || !columnMatrix)
    throw new Error("yargh")

  const rowMatrix = transpose(columnMatrix)

  const selectedOption: LevelTypeOption = {
    label: getDescription(thisLevelType),
    value: {
      houseDna: houses[houseId].dna,
      levelType: thisLevelType,
    },
  }

  const otherOptions = pipe(
    systemModules,
    filterCompatibleModules(["sectionType", "positionType", "level"])(
      thisModule
    ),
    A.map((x) => x.structuredDna.levelType),
    A.uniq(S.Eq),
    A.filterMap((levelType) => {
      if (levelType === thisLevelType) return O.none

      let fail = false

      const newLevel = pipe(
        thisLevel,
        A.map((gridGroup) =>
          pipe(
            gridGroup,
            A.map((module) =>
              pipe(
                systemModules,
                A.filter(
                  keysFilter(
                    ["sectionType", "positionType", "levelType", "gridType"],
                    produce(module, (draft) => {
                      draft.structuredDna.levelType = levelType
                    })
                  )
                ),
                (modules) => {
                  const candidate = pipe(
                    topCandidateByHamming(module)(modules),
                    O.toNullable
                  )
                  if (candidate === null) {
                    fail = true
                  }
                  return candidate as Module
                }
              )
            )
          )
        )
      )

      if (fail) return O.none

      return O.some(
        pipe(
          produce(rowMatrix, (draft) => {
            draft[levelIndex] = newLevel
          }),
          transpose,
          A.map(padColumn),
          columnMatrixToDna,
          (houseDna) =>
            ({
              label: getDescription(levelType),
              value: {
                houseDna,
                levelType,
              },
            } as LevelTypeOption)
        )
      )
    })
  )

  const options = pipe(
    [selectedOption, ...otherOptions],
    A.sort(
      pipe(
        S.Ord,
        Ord.contramap((opt: LevelTypeOption) => opt.label)
      )
    )
  )

  return {
    options,
    selected: selectedOption.value,
    levelString: (() => {
      switch (thisLevelType?.[0]) {
        case "F":
          return "foundations"
        case "R":
          return "roof"
        default:
          return "level"
      }
    })(),
  }
}
