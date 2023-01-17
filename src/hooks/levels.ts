// import { useSystemsData } from "@/contexts/SystemsData"
import {
  Module,
  // useGetStairsModule,
  // useGetVanillaModule,
  usePadColumn,
  useSystemModules,
} from "@/data/modules"
import houses from "@/hooks/houses"
import { A, errorThrower, O, S } from "@/utils/functions"
import { transpose } from "fp-ts-std/Array"
import { filterMap, findFirstMap, replicate, sort, uniq } from "fp-ts/lib/Array"
import { identity, pipe } from "fp-ts/lib/function"
import { getOrElse, match, none, some, toNullable } from "fp-ts/lib/Option"
import { contramap } from "fp-ts/lib/Ord"
import produce from "immer"
import {
  ColumnLayout,
  columnLayoutToMatrix,
  columnMatrixToDna,
  rowMatrixToDna,
  useColumnMatrix,
} from "./layouts"
import { useGetVanillaModule } from "./vanilla"

export const useLevelInteractions = (
  houseId: string,
  levelIndex: number,
  onComplete?: () => void
) => {
  const columnMatrix = useColumnMatrix(houseId)

  const systemId = houses[houseId].systemId

  const getVanillaModule = useGetVanillaModule(systemId)
  // const getStairsModule = useGetStairsModule()
  // const padColumn = usePadColumn()

  const getLevel = (i: number) =>
    pipe(columnMatrix, transpose, A.lookup(i), O.toNullable)

  const thisLevel = getLevel(levelIndex)
  const nextLevel = getLevel(levelIndex + 1)

  if (thisLevel === null) throw new Error("thisLevel null")

  const thisLevelLetter = thisLevel[0][0].structuredDna.levelType[0]
  const nextLevelLetter = nextLevel?.[0][0].structuredDna.levelType[0]

  const targetLevelLetter = nextLevelLetter === "R" ? "T" : "M"
  const targetLevelType = targetLevelLetter + "1"

  const canAddFloorAbove =
    nextLevel !== null && ["R", "M", "T"].includes(targetLevelLetter)

  const canRemoveFloor = ["M", "T"].includes(thisLevelLetter)

  const addFloorAbove = () => {
    if (!canAddFloorAbove) return

    houses[houseId].dna = pipe(
      columnMatrix,
      transpose,
      (rows) => [
        ...rows.slice(0, levelIndex + 1),
        pipe(
          rows[levelIndex],
          A.map((group) =>
            pipe(
              group,
              A.map((m) => {
                const vanillaModule = pipe(
                  getVanillaModule(m, {
                    levelType: targetLevelType,
                  }),
                  match(
                    errorThrower(`no vanilla module found for ${m.dna}`),
                    identity
                  )
                )

                if (m.structuredDna.stairsType === "ST0")
                  return replicate(
                    m.structuredDna.gridUnits /
                      vanillaModule.structuredDna.gridUnits,
                    vanillaModule
                  )
                const stairsModule = pipe(
                  getStairsModule(m, {
                    levelType: targetLevelType,
                  }),
                  errorThrower(
                    `No stairs module found for ${m.dna} level ${targetLevelLetter}`
                  )
                )
                return [stairsModule]
              }),
              flattenA
            )
          )
        ),
        ...rows.slice(levelIndex + 1),
      ],
      transposeA,
      mapA(padColumn),
      columnMatrixToDna
    )
    onComplete?.()
  }
  const removeFloor = () => {
    if (!canRemoveFloor) return

    houses[houseId].dna = pipe(
      columnMatrix,
      transposeA,
      (rows) => [...rows.slice(0, levelIndex), ...rows.slice(levelIndex + 1)],
      mapA(flattenA),
      rowMatrixToDna
    )
    onComplete?.()
  }

  return {
    addFloorAbove,
    removeFloor,
    canAddFloorAbove,
    canRemoveFloor,
  }
}

export type LevelTypeOpt = {
  label: string
  value: { levelType: string; buildingDna: string[] }
}

export const useLevelTypeOptions = (
  buildingId: string,
  columnLayout: ColumnLayout,
  { columnIndex, levelIndex, groupIndex }: ColumnModuleKey
): {
  options: LevelTypeOpt[]
  selected: LevelTypeOpt["value"]
  levelString: string
} => {
  const systemModules = useSystemModules(houses[buildingId].systemId)

  const padColumn = usePadColumn()

  const columnMatrix = columnLayoutToMatrix<BareModule>(columnLayout)

  const rowMatrix = transposeA(columnMatrix)

  const thisLevel = rowMatrix[levelIndex]

  const thisModule =
    columnLayout[columnIndex].gridGroups[levelIndex].modules[groupIndex].module

  const thisLevelType = thisModule.structuredDna.levelType

  const { levelTypes: systemLevelTypes } = useSystemsData()

  const levelTypes = pipe(
    systemLevelTypes,
    filterA((lt) => lt.systemId === thisModule.systemId)
  )

  const getDescription = (levelType: string) =>
    pipe(
      levelTypes,
      findFirstMap((lt) =>
        lt.code === levelType ? some(lt.description) : none
      ),
      getOrElse(() => "")
    )

  const selectedOption: LevelTypeOpt = {
    label: getDescription(thisLevelType),
    value: {
      buildingDna: columnMatrixToDna(columnMatrix),
      levelType: thisLevelType,
    },
  }

  const otherOptions = pipe(
    systemModules,
    filterCompatibleModules(["sectionType", "positionType", "level"])(
      thisModule
    ),
    mapA((x) => x.structuredDna.levelType),
    uniq(StrEq),
    filterMap((levelType) => {
      if (levelType === thisLevelType) return none

      let fail = false

      const newLevel = pipe(
        thisLevel,
        mapA((gridGroup) =>
          pipe(
            gridGroup,
            mapA((module) =>
              pipe(
                systemModules as BareModule[],
                filterA(
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
                    toNullable
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

      if (fail) return none

      return some(
        pipe(
          produce(rowMatrix, (draft) => {
            draft[levelIndex] = newLevel
          }),
          transpose,
          A.map(padColumn),
          columnMatrixToDna,
          (buildingDna) =>
            ({
              label: getDescription(levelType),
              value: {
                buildingDna,
                levelType,
              },
            } as LevelTypeOpt)
        )
      )
    })
  )

  return {
    options: pipe(
      [selectedOption, ...otherOptions],
      sort(
        pipe(
          S.Ord,
          contramap((opt: LevelTypeOpt) => opt.label)
        )
      )
    ),
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
