import * as A from "fp-ts/Array"
import { pipe } from "fp-ts/lib/function"
import produce from "immer"
import {
  filterCompatibleModules,
  Module,
  useGetStairsModule,
  usePadColumn,
  useSystemModules,
} from "@/data/modules"
import { NEA, O, RA, S, upperFirst } from "@/utils/functions"
import houses from "@/hooks/houses"
import { useGetVanillaModule } from "@/hooks/vanilla"
import {
  HouseModuleIdentifier,
  layouts,
  ColumnLayout,
  PositionedModule,
  columnLayoutToDNA,
  columnLayoutToMatrix,
  columnMatrixToDna,
} from "@/hooks/layouts"
import { StairType, useSystemStairTypes } from "../../data/stairTypes"

export const useChangeModuleLayout = ({
  houseId,
  columnIndex,
  levelIndex,
  gridGroupIndex,
}: HouseModuleIdentifier) => {
  const systemId = houses[houseId].systemId
  const getVanillaModule = useGetVanillaModule(systemId)

  const columnLayout = layouts[houseId]

  const oldModule =
    columnLayout[columnIndex].gridGroups[levelIndex].modules[gridGroupIndex]
      .module

  return (newModule: Module): string[] => {
    const gridUnitDiff =
      newModule.structuredDna.gridUnits - oldModule.structuredDna.gridUnits

    const { sign } = Math

    const roofIndex = columnLayout[columnIndex].gridGroups.length - 1

    switch (true) {
      case sign(gridUnitDiff) < 0: {
        // for this level index vanilla the gridUnitDiff
        const vanillaModule = getVanillaModule(newModule)

        return pipe(vanillaModule, (vanillaModule) =>
          pipe(
            columnLayout,
            produce((draft: ColumnLayout) => {
              draft[columnIndex].gridGroups[levelIndex].modules[
                gridGroupIndex
              ].module.dna = newModule.dna
              draft[columnIndex].gridGroups[levelIndex].modules = [
                ...draft[columnIndex].gridGroups[levelIndex].modules,
                ...pipe(
                  A.replicate(-gridUnitDiff, vanillaModule),
                  A.mapWithIndex(
                    (i, module): PositionedModule => ({
                      module,
                      z: 0,
                      gridGroupIndex: gridGroupIndex + i + 1,
                    })
                  )
                ),
              ]
            }),
            columnLayoutToDNA
          )
        )
      }

      case sign(gridUnitDiff) > 0: {
        // new module is bigger
        // for this level vanilla all other levels
        return pipe(
          columnLayout,
          produce((draft) => {
            draft[columnIndex].gridGroups[levelIndex].modules[
              gridGroupIndex
            ].module.dna = newModule.dna
            pipe(
              NEA.range(0, roofIndex),
              A.filter((x) => x !== levelIndex)
            ).forEach((i) => {
              const m0 =
                columnLayout[columnIndex].gridGroups[i].modules[0].module
              const vanillaModule = getVanillaModule(m0)

              pipe(vanillaModule, (vanillaModule) => {
                draft[columnIndex].gridGroups[i].modules = [
                  ...draft[columnIndex].gridGroups[i].modules,
                  ...pipe(
                    A.replicate(
                      gridUnitDiff / vanillaModule.structuredDna.gridUnits,
                      vanillaModule
                    ),
                    A.map((module) => ({ module, z: 0 }))
                  ),
                ]
              })
            })
          }),
          columnLayoutToDNA
        )
      }

      case sign(gridUnitDiff) === 0:
      default:
        // just swap the module
        return pipe(
          columnLayout,
          produce((draft) => {
            draft[columnIndex].gridGroups[levelIndex].modules[
              gridGroupIndex
            ].module.dna = newModule.dna
          }),
          columnLayoutToDNA
        ) as string[]
    }
  }
}

export type LayoutOpt = {
  label: string
  value: { module: Module; houseDna: string[] }
  thumbnail?: string
}

export const useLayoutOptions = ({
  houseId,
  columnIndex,
  levelIndex,
  gridGroupIndex,
}: HouseModuleIdentifier): {
  options: LayoutOpt[]
  selected: LayoutOpt["value"]
} => {
  const systemId = houses[houseId].systemId
  const layout = layouts[houseId]
  const m =
    layout[columnIndex].gridGroups[levelIndex].modules[gridGroupIndex].module

  const systemModules = useSystemModules({ systemId })

  const changeModuleLayout = useChangeModuleLayout({
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
  })

  const options = pipe(
    systemModules,
    filterCompatibleModules([
      "sectionType",
      "positionType",
      "levelType",
      "gridType",
      "stairsType",
    ])(m),
    A.map(
      (m): LayoutOpt => ({
        label: pipe(
          m.description ?? "",
          upperFirst,
          O.getOrElse(() => m.dna)
        ),
        value: {
          module: m,
          houseDna: changeModuleLayout(m),
        },
        thumbnail: m.visualReference,
      })
    )
  )

  const { value: selected } = pipe(
    options,
    A.findFirst((x) => x.value.module.dna === m.dna),
    O.getOrElse(() => options[0])
  )

  return { options, selected }
}

export type StairsOpt = {
  label: string
  value: { stairType: string; houseDna: string[] }
  thumbnail?: string
}

export const useStairsOptions = ({
  houseId,
  columnIndex,
  levelIndex,
  gridGroupIndex,
}: HouseModuleIdentifier): {
  options: StairsOpt[]
  selected: StairsOpt["value"]
} => {
  const systemId = houses[houseId].systemId
  const layout = layouts[houseId]

  const stairTypes = useSystemStairTypes({ systemId })

  const getStairsModule = useGetStairsModule(systemId)
  const padColumn = usePadColumn(systemId)

  const m =
    layout[columnIndex].gridGroups[levelIndex].modules[gridGroupIndex].module

  const selected: StairsOpt["value"] = {
    stairType: m.structuredDna.stairsType,
    houseDna: columnLayoutToDNA(layout),
  }

  const columnMatrix = columnLayoutToMatrix(layout)

  const roofIndex = layout[columnIndex].gridGroups.length - 1
  const groundIndex = 1

  const targetGridUnits = columnMatrix[columnIndex][levelIndex]
    .slice(0, gridGroupIndex)
    .reduce((acc, m) => acc + m.structuredDna.gridUnits, 0)

  const levelGroupIndices = pipe(
    NEA.range(groundIndex, roofIndex),
    A.map((levelIdx) =>
      pipe(
        columnMatrix[columnIndex][levelIdx],
        RA.reduceWithIndex(
          { groupIndex: 0, gridUnits: 0, module: null },
          (
            i,
            acc: {
              groupIndex: number
              gridUnits: number
              module: Module | null
            },
            module
          ) => {
            const nextGridUnits = acc.gridUnits + module.structuredDna.gridUnits
            const nextModule =
              acc.module === null && acc.gridUnits === targetGridUnits
                ? module
                : acc.module
            return {
              gridUnits: nextGridUnits,
              module: nextModule,
              groupIndex: nextModule === null ? i : acc.groupIndex, // maybe +1?
            }
          }
        ),
        ({ groupIndex }) => {
          if (m === null)
            throw new Error(
              "Appropriate stairs module not found where expected"
            )
          return [levelIdx, groupIndex] as [number, number]
        }
      )
    )
  )

  const options = pipe(
    stairTypes,
    A.reduce(new Map<StairType["code"], StairsOpt>(), (acc, stairType) => {
      const newLevels = pipe(
        levelGroupIndices,
        A.filterMap(([levelIdx, groupIdx]) => {
          return pipe(
            getStairsModule(columnMatrix[columnIndex][levelIdx][groupIdx], {
              stairsType: stairType.code,
            }),
            O.map((newModule) =>
              produce(columnMatrix[columnIndex][levelIdx], (draft) => {
                draft[groupIdx] = newModule
              })
            )
          )
        })
      )

      if (newLevels.length !== roofIndex - groundIndex + 1) {
        return acc
      }

      const newColumn = [columnMatrix[columnIndex][0], ...newLevels]

      if (newLevels.length === roofIndex - groundIndex + 1) {
        acc.set(
          stairType.code,
          pipe(
            columnMatrix,
            produce((draft) => {
              draft[columnIndex] = padColumn(newColumn)
            }),
            columnMatrixToDna,
            (houseDna) => ({
              label:
                stairTypes.find((x) => x.code === stairType.code)
                  ?.description ?? stairType.code,
              value: { houseDna, stairType: stairType.code },
              thumbnail: stairType.imageUrl,
            })
          )
        )
      }

      return acc
    }),
    (map) => Array.from(map.values())
  )

  return { options, selected }
}
