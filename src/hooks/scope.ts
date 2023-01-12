import { proxy, useSnapshot } from "valtio"

export type ScopeItem = {
  elementName: string
  groupIndex: number
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

export default scope
