import { transpose } from "fp-ts-std/Array"
import { pipe } from "fp-ts/lib/function"
import { proxy, useSnapshot } from "valtio"
import { A, O } from "~/utils/functions"
import { columnLayoutToMatrix, layouts } from "~/design/state/layouts"
import { getHouseLayoutsKey } from "../../db/layouts"
import houses from "./houses"

export type ScopeItem = {
  ifcTag: string
  gridGroupIndex: number
  levelIndex: number
  columnIndex: number
  houseId: string
}

export type Scope = {
  selected: ScopeItem | null
  hovered: ScopeItem | null
}

const scope = proxy<Scope>({
  hovered: null,
  selected: null,
})

export const useScope = () => useSnapshot(scope) as typeof scope

export const getSelectedModule = () => {
  if (scope.selected === null) return null
  const { houseId, columnIndex, levelIndex, gridGroupIndex } = scope.selected

  const { systemId, dnas } = houses[houseId]

  const layoutsKey = getHouseLayoutsKey({ systemId, dnas })

  return layouts[layoutsKey][columnIndex].gridGroups[levelIndex].modules[
    gridGroupIndex
  ].module
}

export const getSelectedLevelType = () =>
  getSelectedModule()?.structuredDna?.levelType ?? null

export const getSelectedColumnMatrix = () => {
  if (scope.selected === null) return null
  const { houseId } = scope.selected
  const { systemId, dnas } = houses[houseId]
  const layoutsKey = getHouseLayoutsKey({ systemId, dnas })
  return columnLayoutToMatrix(layouts[layoutsKey])
}
export const getSelectedLevelModules = () => {
  if (scope.selected === null) return null
  const { levelIndex } = scope.selected

  const columnMatrix = getSelectedColumnMatrix()
  if (columnMatrix === null) throw new Error("columnMatrix null")

  const getLevel = (i: number) =>
    pipe(columnMatrix, transpose, A.lookup(i), O.toNullable)

  const thisLevel = getLevel(levelIndex)

  return thisLevel
}

export default scope
