import { liveQuery } from "dexie"
import { pipe } from "fp-ts/lib/function"
import { Group } from "three"
import layoutsDB, {
  ColumnLayout,
  getVanillaColumnsKey,
  PositionedRow,
  VanillaColumn,
  VanillaColumnsKey,
} from "../../../../db/layouts"
import { A, O, R, T } from "../../../../utils/functions"
import { getLayoutsWorker } from "../../../../workers"
import { createModuleGroup } from "./moduleGroup"
import {
  ColumnGroup,
  ColumnGroupUserData,
  GridGroupUserData,
  HouseTransformsGroup,
  ModuleGroupUse,
  UserDataTypeEnum,
} from "./userData"

// serialized layout key : column
export let vanillaColumns: Record<string, VanillaColumn> = {}

liveQuery(() => layoutsDB.vanillaColumns.toArray()).subscribe(
  (dbVanillaColumns) => {
    for (let dbVanillaColumn of dbVanillaColumns) {
      const { systemId, sectionType, levelTypes, vanillaColumn } =
        dbVanillaColumn
      vanillaColumns[
        getVanillaColumnsKey({ systemId, sectionType, levelTypes })
      ] = vanillaColumn
    }
  }
)

export const getVanillaColumn = ({
  systemId,
  sectionType,
  levelTypes,
}: VanillaColumnsKey): T.Task<VanillaColumn> => {
  const key = getVanillaColumnsKey({ systemId, sectionType, levelTypes })

  return pipe(
    vanillaColumns,
    R.lookup(key),
    O.match(
      () => {
        const layoutsWorker = getLayoutsWorker()
        if (!layoutsWorker) throw new Error(`no layouts worker`)
        return () =>
          layoutsWorker
            .getVanillaColumn({
              systemId,
              sectionType,
              levelTypes,
            })
            .catch((e) => {
              console.log(e, `in getVanillaColumn in columnGroup`)
              throw e
            })
      },
      (vanillaColumn) => T.of(vanillaColumn)
    )
  )
}

export const splitColumnGroups = (columnGroups: ColumnGroup[]) =>
  pipe(
    columnGroups,
    A.partition(
      ({ userData: { columnIndex } }) =>
        columnIndex === 0 || columnIndex === columnGroups.length - 1
    ),
    ({ left: midColumnGroups, right: [startColumnGroup, endColumnGroup] }) => ({
      startColumnGroup,
      endColumnGroup,
      midColumnGroups,
    })
  )

export const createColumnGroup =
  ({
    systemId,
    houseId,
    positionedRows,
    columnIndex,
    startColumn = false,
    endColumn = false,
    houseTransformsGroup,
  }: {
    systemId: string
    houseId: string
    positionedRows: PositionedRow[]
    columnIndex: number
    startColumn?: boolean
    endColumn?: boolean
    houseTransformsGroup: HouseTransformsGroup
  }): T.Task<ColumnGroup> =>
  async () => {
    const columnGroup = new Group()

    for (let { positionedModules, y, levelIndex } of positionedRows) {
      const gridGroup = new Group()
      let length = 0

      for (let {
        z,
        module,
        moduleIndex: gridGroupIndex,
      } of positionedModules) {
        const moduleGroup = await createModuleGroup({
          systemId,
          houseId,
          module,
          gridGroupIndex,
          z,
          flip: endColumn,
          use: ModuleGroupUse.Enum.INITIAL,
          visible: true,
          houseTransformsGroup,
        })

        gridGroup.position.setY(y)
        gridGroup.add(moduleGroup)

        length += module.length
      }

      const gridGroupUserData: GridGroupUserData = {
        type: UserDataTypeEnum.Enum.GridGroup,
        levelIndex,
        length,
        height: positionedModules[0].module.height,
      }
      gridGroup.userData = gridGroupUserData

      columnGroup.add(gridGroup)
    }

    const columnGroupUserData: ColumnGroupUserData = {
      type: UserDataTypeEnum.Enum.ColumnGroup,
      columnIndex,
      length: positionedRows[0].rowLength,
      startColumn,
      endColumn,
    }

    columnGroup.userData = columnGroupUserData

    return columnGroup as ColumnGroup
  }

export const createColumnGroups = ({
  systemId,
  houseId,
  houseLayout,
  houseTransformsGroup,
}: {
  systemId: string
  houseId: string
  houseTransformsGroup: HouseTransformsGroup
  houseLayout: ColumnLayout
}): T.Task<ColumnGroup[]> =>
  pipe(
    houseLayout,
    A.traverseWithIndex(T.ApplicativeSeq)(
      (i, { positionedRows: gridGroups, z, columnIndex }) => {
        const startColumn = i === 0
        const endColumn = i === houseLayout.length - 1

        const task = createColumnGroup({
          systemId,
          houseId,
          positionedRows: gridGroups,
          startColumn,
          endColumn,
          columnIndex,
          houseTransformsGroup,
        })

        return pipe(
          task,
          T.map((columnGroup) => {
            columnGroup.position.set(0, 0, z)
            return columnGroup
          })
        )
      }
    )
  )
