import { Group, Mesh, Plane } from "three"
import { OBB } from "three-stdlib"
import { z } from "zod"

// maybe want some updater functions to update all the user data in the tree

// or at certain levels/scopes?

// houseGroup has
// -> zCenterGroup as singleton child has
//   -> columnGroups as children has
//     -> gridGroups as children has
//       -> moduleGroups as children has
//         -> elementMeshes as children

// needs HouseTransformGroup
// HouseColumnsGroup

export const UserDataTypeEnum = z.enum([
  "HouseRootGroup",
  "HouseColumnsContainerGroup",
  "ColumnGroup",
  "GridGroup",
  "ModuleGroup",
  "ElementMesh",
])
export type UserDataTypeEnum = z.infer<typeof UserDataTypeEnum>

export type HouseRootGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.HouseRootGroup
  systemId: string
  houseId: string
  dnas: string[]
  friendlyName: string
  modifiedMaterials: Record<string, string>
  height: number
  length: number
  width: number
  obb: OBB
  clippingPlanes: Plane[]
  clippingPlaneCaps: Record<string, Mesh>
  columnCount: number
  levelTypes: string[]
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

export type UserData =
  | ElementMeshUserData
  | ModuleGroupUserData
  | GridGroupUserData
  | ColumnGroupUserData
  | HouseRootGroupUserData
