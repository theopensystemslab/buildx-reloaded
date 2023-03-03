import { proxy } from "valtio"

export type HouseElementIdentifier = {
  identifierType: "HOUSE_ELEMENT"
  systemId: string
  houseId: string
  columnIndex: number
  levelIndex: number
  gridGroupIndex: number
  elementName: string
}

export type RotateHandleIdentifier = {
  identifierType: "ROTATE_HANDLE"
  houseId: string
}

export type StretchHandleIdentifier = {
  identifierType: "STRETCH_HANDLE"
  houseId: string
  axis: "z" | "x"
  direction: 1 | -1
}

export type DragIdentifier =
  | StretchHandleIdentifier
  | RotateHandleIdentifier
  | HouseElementIdentifier

export type Drag = {
  identifier: DragIdentifier
  point: V3
}

type Drags = {
  start: Drag | null
  drag: Drag | null
  end: boolean
}

const dragProxy = proxy<Drags>({
  start: null,
  drag: null,
  end: true,
})

export default dragProxy
