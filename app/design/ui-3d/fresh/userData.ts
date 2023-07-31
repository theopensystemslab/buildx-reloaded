import { Plane } from "three"
import { OBB } from "three-stdlib"
import { z } from "zod"
import { ColumnLayout } from "../../../db/layouts"

// HouseRootGroup has
// -> HouseColumnsContainerGroup as singleton child has
//   -> ColumnsGroup's as children has
//     -> GridGroup's as children has
//       -> ModuleGroup's as children has
//         -> ElementMesh's as children
// -> Stretch Handles
// -> Rotate Handles

export const UserDataTypeEnum = z.enum([
  "HouseRootGroup",
  "HouseColumnsContainerGroup",
  "ColumnGroup",
  "GridGroup",
  "ModuleGroup",
  "ElementMesh",
  "StretchHandleMesh",
  "RotateHandleMesh",
])
export type UserDataTypeEnum = z.infer<typeof UserDataTypeEnum>

export type HouseRootGroupUserData = {
  // all
  type: typeof UserDataTypeEnum.Enum.HouseRootGroup
  systemId: string
  houseId: string
  houseTypeId: string
  friendlyName: string
  clippingPlanes: Plane[]
  // preview specific
  height: number
  length: number
  width: number
  obb: OBB
  columnCount: number
  sectionType: string
  levelTypes: string[]
  modifiedMaterials: Record<string, string>
  dnas: string[]
  houseLayout: ColumnLayout
}

export type HouseColumnsContainerUserData = {
  type: typeof UserDataTypeEnum.Enum.HouseColumnsContainerGroup
}

export type ColumnGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.ColumnGroup
  columnIndex: number
  length: number
  startColumn?: boolean
  endColumn?: boolean
}

export type GridGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.GridGroup
  levelIndex: number
  length: number
}

export type ModuleGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.ModuleGroup
  gridGroupIndex: number
  dna: string
  length: number
}

export type ElementMeshUserData = {
  type: typeof UserDataTypeEnum.Enum.ElementMesh
  ifcTag: string
}

export type StretchHandleMeshUserData = {
  type: typeof UserDataTypeEnum.Enum.StretchHandleMesh
  axis: "z" | "x"
  direction: 1 | -1
}

export type RotateHandleMeshUserData = {
  type: typeof UserDataTypeEnum.Enum.RotateHandleMesh
}

export type UserData =
  | ElementMeshUserData
  | ModuleGroupUserData
  | GridGroupUserData
  | ColumnGroupUserData
  | HouseColumnsContainerUserData
  | HouseRootGroupUserData
  | StretchHandleMeshUserData
  | RotateHandleMeshUserData
