import { proxy, useSnapshot } from "valtio"
import { ElementMesh } from "../ui-3d/fresh/scene/userData"

export type ScopeElement = {
  ifcTag: string
  dna: string
  columnIndex: number
  levelIndex: number
  moduleIndex: number
  houseId: string
  object: ElementMesh
}

export type Scope = {
  selected: ScopeElement | null
  hovered: ScopeElement | null
}

const scope = proxy<Scope>({
  hovered: null,
  selected: null,
})

export const useScope = () => useSnapshot(scope) as typeof scope

export default scope
