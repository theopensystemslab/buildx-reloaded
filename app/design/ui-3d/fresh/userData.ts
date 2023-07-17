import { Group, Plane } from "three"
import { OBB } from "three-stdlib"
import { z } from "zod"

// maybe want some updater functions to update all the user data in the tree

// or at certain levels/scopes?

// houseGroup has
//  -> columnGroups as children has
//    -> gridGroups as children has
//      -> moduleGroups as children has
//        -> elementMeshes as children

export const UserDataTypeEnum = z.enum([
  "HouseGroup",
  "ColumnGroup",
  "GridGroup",
  "ModuleGroup",
  "ElementMesh",
])
export type UserDataTypeEnum = z.infer<typeof UserDataTypeEnum>

export type HouseGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.HouseGroup
  systemId: string
  houseId: string
  dnas: string[]
  friendlyName: string
  modifiedMaterials: Record<string, string>
  height: number
  length: number
  width: number
  obb: OBB
  clippingPlanes: {
    x: Plane
    y: Plane
    z: Plane
  }
  columnCount: number
  levelTypes: string[]
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
  | HouseGroupUserData

// ASSUMPTIONS
// -----------
// we've updated the ... something or other...
export const updateHouseUserData = (houseGroup: Group) => {}

// MORE GRANULAR
// -------------
// update SOME PART OF THE HOUSE
//   based on SOME OTHER PARTS OF THE HOUSE
export const updateClippingPlanes = (houseGroup: Group) => {
  const houseGroupUserData = houseGroup.userData as HouseGroupUserData

  // x, y, z...

  // x and z is like okay yeah standard or... well...
  // dynamic on user controls could be cool

  // y is like dependent on levelIndex of level mode

  // first we want the clipping planes in the user data
}

export const getClippingPlanesStuff = (houseGroup: Group) => {
  // dimensions should do it I guess?
}
