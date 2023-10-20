import Dexie from "dexie"
import { Module } from "../../server/data/modules"
import { LastFetchStamped } from "./systems"

export type PositionedModule = {
  module: Module
  z: number
  gridGroupIndex: number
}

export type PositionedRow = {
  levelIndex: number
  levelType: string
  y: number
  positionedModules: Array<PositionedModule>
  rowLength: number
}

export type RowLayout = Array<PositionedRow>

export type PositionedColumn = {
  positionedRows: Array<PositionedRow>
  z: number
  columnIndex: number
  columnLength: number
}

export type ColumnLayout = Array<PositionedColumn>

export const validatePositionedRow = (row: PositionedRow): void => {
  // Validate the length of the PositionedRow
  const totalModulesLength = row.positionedModules.reduce(
    (acc, mod) => acc + mod.module.length,
    0
  )
  if (row.rowLength !== totalModulesLength) {
    console.log(`Row Length Mismatch: `, {
      rowLength: row.rowLength,
      totalModulesLength,
      positionedModules: row.positionedModules,
    })
    throw new Error(
      `Invalid PositionedRow length. Expected ${totalModulesLength} but got ${row.rowLength}`
    )
  }

  // Validate the z values of PositionedModules
  for (let i = 0; i < row.positionedModules.length; i++) {
    const positionedModule = row.positionedModules[i]
    const isFirst = i === 0

    const expectedZ = isFirst
      ? positionedModule.module.length / 2
      : row.positionedModules[i - 1].z +
        row.positionedModules[i - 1].module.length / 2 +
        positionedModule.module.length / 2

    if (positionedModule.z !== expectedZ) {
      console.log(`Z-Value Mismatch for Module at Index ${i}:`, {
        expectedZ,
        actualZ: positionedModule.z,
        positionedModule,
      })
      throw new Error(
        `Invalid z value for module at index ${i}. Expected ${expectedZ} but got ${positionedModule.z}`
      )
    }

    // New logic to validate module's levelType against PositionedRow's levelType
    const moduleLevelType = positionedModule.module.structuredDna.levelType
    if (moduleLevelType !== row.levelType) {
      console.log(`LevelType Mismatch for Module at Index ${i}:`, {
        moduleLevelType,
        rowLevelType: row.levelType,
        positionedModule,
      })
      throw new Error(
        `Mismatched levelType for module at index ${i}. Module has levelType '${moduleLevelType}', but PositionedRow expects '${row.levelType}'.`
      )
    }
  }
}

export const validatePositionedColumn = (column: PositionedColumn): void => {
  if (column.positionedRows.length === 0) {
    throw new Error("PositionedColumn contains no PositionedRows.")
  }

  // Validate each PositionedRow in the column
  column.positionedRows.forEach((row, rowIndex) => {
    try {
      validatePositionedRow(row)
    } catch (error) {
      if (error instanceof Error) {
        console.log(
          `Validation Error for PositionedRow at Index ${rowIndex}:`,
          {
            rowIndex,
            error,
            row,
          }
        )
        throw new Error(
          `Error in PositionedRow at index ${rowIndex}: ${error.message}`
        )
      }
      throw error // If it's not an instance of Error, rethrow it anyway
    }
  })

  // Get the length of the first row to compare with the others and with the column's length
  const firstRowLength = column.positionedRows[0].rowLength

  if (column.columnLength !== firstRowLength) {
    console.log("Column Length Mismatch:", {
      columnLength: column.columnLength,
      expectedLength: firstRowLength,
    })
    throw new Error(
      `Invalid PositionedColumn length. Expected ${firstRowLength} but got ${column.columnLength}`
    )
  }

  // Ensure all rows have the same length as the first row
  for (let i = 1; i < column.positionedRows.length; i++) {
    const rowLength = column.positionedRows[i].rowLength
    if (rowLength !== firstRowLength) {
      console.log(`Row Length Mismatch at Row Index ${i}:`, {
        rowLength,
        expectedLength: firstRowLength,
      })
      throw new Error(
        `Mismatched length for PositionedRow at index ${i}. Expected ${firstRowLength} but got ${rowLength}`
      )
    }
  }
}

export type AugPosRow = PositionedRow & {
  vanillaModule: Module
  gridUnits: number
}

export type AugPosCol = PositionedColumn & {
  positionedRows: AugPosRow[]
}

export const addModuleToRow = (
  row: AugPosRow,
  moduleToAdd: Module
): AugPosRow => {
  // 1. Calculate the new z value for the module being added
  const lastPositionedModule =
    row.positionedModules[row.positionedModules.length - 1]
  const lastModuleZ = lastPositionedModule ? lastPositionedModule.z : 0
  const lastModuleLength = lastPositionedModule
    ? lastPositionedModule.module.length
    : 0

  const newModuleZ = lastPositionedModule
    ? lastModuleZ + lastModuleLength / 2 + moduleToAdd.length / 2
    : moduleToAdd.length / 2

  // 2. Calculate the gridGroupIndex for the new PositionedModule
  const lastGridGroupIndex = lastPositionedModule
    ? lastPositionedModule.gridGroupIndex
    : -1
  const newGridGroupIndex = lastGridGroupIndex + 1

  // 3. Create the PositionedModule using the computed values
  const newPositionedModule: PositionedModule = {
    module: moduleToAdd,
    z: newModuleZ,
    gridGroupIndex: newGridGroupIndex,
  }

  // 4. Update the length
  const updatedLength = row.rowLength + moduleToAdd.length

  // 5. Update the gridUnits by extracting gridUnits from moduleToAdd's structuredDna
  const additionalGridUnits = moduleToAdd.structuredDna.gridUnits
  const updatedGridUnits = row.gridUnits + additionalGridUnits

  // 6. Add the module to positionedModules
  const updatedPositionedModules = [
    ...row.positionedModules,
    newPositionedModule,
  ]

  // Return the updated AugPosRow
  return {
    ...row,
    positionedModules: updatedPositionedModules,
    rowLength: updatedLength,
    gridUnits: updatedGridUnits,
  }
}

export const addModulesToRow = (
  row: AugPosRow,
  modulesToAdd: Module[]
): AugPosRow => {
  let currentRow = row

  for (const moduleToAdd of modulesToAdd) {
    currentRow = addModuleToRow(currentRow, moduleToAdd)
  }

  return currentRow
}

export const swapModuleInRow = (
  row: AugPosRow,
  gridGroupIndexToSwap: number,
  newModule: Module
): AugPosRow => {
  const positionedModulesCopy = [...row.positionedModules]
  const targetIndex = positionedModulesCopy.findIndex(
    (pm) => pm.gridGroupIndex === gridGroupIndexToSwap
  )

  if (targetIndex === -1) {
    throw new Error(
      `No PositionedModule found with gridGroupIndex: ${gridGroupIndexToSwap}`
    )
  }

  // Extract the old module and calculate difference in lengths
  const oldModule = positionedModulesCopy[targetIndex].module
  const lengthDiff = newModule.length - oldModule.length

  // Update the module at target index
  positionedModulesCopy[targetIndex].module = newModule

  // Recalculate z values for subsequent modules if needed
  if (lengthDiff !== 0) {
    for (let i = targetIndex; i < positionedModulesCopy.length; i++) {
      positionedModulesCopy[i].z += lengthDiff / 2
    }
  }

  // Update the length and gridUnits
  const updatedLength = row.rowLength + lengthDiff
  const gridUnitsDiff =
    newModule.structuredDna.gridUnits - oldModule.structuredDna.gridUnits
  const updatedGridUnits = row.gridUnits + gridUnitsDiff

  return {
    ...row,
    positionedModules: positionedModulesCopy,
    rowLength: updatedLength,
    gridUnits: updatedGridUnits,
  }
}

export type IndexedModel = LastFetchStamped<{
  speckleBranchUrl: string
  geometries: any
  systemId: string
}>

export type HouseLayoutsKey = {
  systemId: string
  dnas: string[]
}

export type ModuleIdentifier = {
  columnIndex: number
  levelIndex: number
  gridGroupIndex: number
}

export type HouseModuleIdentifier = ModuleIdentifier & {
  houseId: string
}

export type SystemHouseModuleIdentifier = HouseModuleIdentifier & {
  systemId: string
}

export const getHouseLayoutsKey = ({ systemId, dnas }: HouseLayoutsKey) =>
  `${systemId}:${dnas}`

export const invertHouseLayoutsKey = (key: string): HouseLayoutsKey => {
  const [systemId, dnasString] = key.split(":")
  const dnas = dnasString.split(",")
  return { systemId, dnas }
}

export type IndexedLayout = {
  systemId: string
  dnas: string[]
  layout: ColumnLayout
}

export type IndexedVanillaModule = {
  systemId: string
  sectionType: string
  positionType: string
  levelType: string
  gridType: string
  moduleDna: string
}

export type VanillaColumn = Omit<PositionedColumn, "z" | "columnIndex">

export type IndexedVanillaColumn = {
  systemId: string
  sectionType: string
  levelTypes: string[]
  vanillaColumn: VanillaColumn
}

export type VanillaColumnsKey = {
  systemId: string
  sectionType: string
  levelTypes: string[]
}

export const getVanillaColumnsKey = ({
  systemId,
  sectionType,
  levelTypes,
}: VanillaColumnsKey): string => `${systemId}:${sectionType}:${levelTypes}`

export const invertVanillaColumnsKey = (key: string): VanillaColumnsKey => {
  const [systemId, sectionType, levelTypesString] = key.split(":")
  const levelTypes = levelTypesString.split(",")
  return { systemId, sectionType, levelTypes }
}

class LayoutsDatabase extends Dexie {
  models: Dexie.Table<IndexedModel, string>
  houseLayouts: Dexie.Table<IndexedLayout, string>
  vanillaModules: Dexie.Table<IndexedVanillaModule, string>
  vanillaColumns: Dexie.Table<IndexedVanillaColumn, string>

  constructor() {
    super("LayoutsDatabase")
    this.version(1).stores({
      models: "speckleBranchUrl,systemId",
      houseLayouts: "[systemId+dnas]",
      vanillaModules: "[systemId+sectionType+positionType+levelType+gridType]",
      vanillaColumns: "[systemId+sectionType+levelTypes]",
    })
    this.houseLayouts = this.table("houseLayouts")
    this.models = this.table("models")
    this.vanillaModules = this.table("vanillaModules")
    this.vanillaColumns = this.table("vanillaColumns")
  }
}

// Create Dexie database
const layoutsDB = new LayoutsDatabase()

export default layoutsDB
