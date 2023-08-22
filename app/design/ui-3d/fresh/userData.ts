import {
  BufferGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Plane,
} from "three"
import { OBB } from "three-stdlib"
import { z } from "zod"
import { ColumnLayout, VanillaColumn } from "../../../db/layouts"
import { ScopeItem } from "../../state/scope"

// HouseTransformsGroup has

// -> HouseLayoutGroup's as children
//      (alternative layouts;
//         visibility/raycasting disabled
//           except 1)
//   -> ColumnsGroup's as children have
//     -> GridGroup's as children have
//       -> ModuleGroup's as children have
//         -> ElementMesh's as children
// -> Stretch Handles meshes
// -> Rotate Handles group
//   -> Rotate Handles meshes

export const UserDataTypeEnum = z.enum([
  "HouseTransformsGroup",
  "HouseLayoutGroup",
  "ColumnGroup",
  "GridGroup",
  "ModuleGroup",
  "ElementMesh",
  "StretchHandleGroup",
  "StretchHandleMesh",
  "RotateHandlesGroup",
  "RotateHandleMesh",
])

export type UserDataTypeEnum = z.infer<typeof UserDataTypeEnum>

export type HouseTransformsGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.HouseTransformsGroup
  systemId: string
  houseId: string
  houseTypeId: string
  friendlyName: string
  clippingPlanes: Plane[]
  activeLayoutGroupUuid: string
  initHandles: () => void
  syncWidthHandles: () => void
  syncRotateHandles: () => void
  setActiveLayoutGroup: (layoutGroup: HouseLayoutGroup) => void
}

export type HouseLayoutGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.HouseLayoutGroup
  dnas: string[]
  houseLayout: ColumnLayout
  vanillaColumn: VanillaColumn
  levelTypes: string[]
  obb: OBB
  height: number
  length: number
  width: number
  columnCount: number
  sectionType: string
  modifiedMaterials: Record<string, string>
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
  height: number
}

export type ModuleGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.ModuleGroup
  gridGroupIndex: number
  dna: string
  length: number
}

// M

export type ElementMeshUserData = {
  type: typeof UserDataTypeEnum.Enum.ElementMesh
  ifcTag: string
}

// --- HANDLES ---

export type StretchHandleGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.StretchHandleGroup
  axis: "z" | "x"
  side: 1 | -1
  updateXHandleLength: (length: number) => void
}

export type StretchHandleMeshUserData = {
  type: typeof UserDataTypeEnum.Enum.StretchHandleMesh
}

export type RotateHandlesGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.RotateHandlesGroup
}

export type RotateHandleMeshUserData = {
  type: typeof UserDataTypeEnum.Enum.RotateHandleMesh
}

// ---

export type UserData =
  | ElementMeshUserData
  | ModuleGroupUserData
  | GridGroupUserData
  | ColumnGroupUserData
  | HouseLayoutGroupUserData
  | HouseTransformsGroupUserData
  | StretchHandleMeshUserData
  | RotateHandlesGroupUserData

// Mesh Types with type variables
export type ElementMesh = Mesh<BufferGeometry, MeshStandardMaterial> & {
  userData: ElementMeshUserData
}

export type StretchHandleMesh = Mesh<BufferGeometry, MeshStandardMaterial> & {
  userData: StretchHandleMeshUserData
}

export type RotateHandleMesh = Mesh<BufferGeometry, MeshStandardMaterial> & {
  userData: RotateHandleMeshUserData
}

// Group Types remain the same
export type ModuleGroup = Group & {
  userData: ModuleGroupUserData
}

export type GridGroup = Group & {
  userData: GridGroupUserData
}

export type ColumnGroup = Group & {
  userData: ColumnGroupUserData
}

export type HouseLayoutGroup = Group & {
  userData: HouseLayoutGroupUserData
}

export type HouseTransformsGroup = Group & {
  userData: HouseTransformsGroupUserData
}

export type RotateHandlesGroup = Group & {
  userData: RotateHandlesGroupUserData
}

export type StretchHandleGroup = Group & {
  userData: StretchHandleGroupUserData
}

// Type Guards
export const isElementMesh = (node: Object3D): node is ElementMesh =>
  node.userData?.type === UserDataTypeEnum.Enum.ElementMesh

export const isStretchHandleMesh = (
  node: Object3D
): node is StretchHandleMesh =>
  node.userData?.type === UserDataTypeEnum.Enum.StretchHandleMesh

export const isRotateHandleMesh = (node: Object3D): node is RotateHandleMesh =>
  node.userData?.type === UserDataTypeEnum.Enum.RotateHandleMesh

export const isModuleGroup = (node: Object3D): node is ModuleGroup =>
  node.userData?.type === UserDataTypeEnum.Enum.ModuleGroup

export const isGridGroup = (node: Object3D): node is GridGroup =>
  node.userData?.type === UserDataTypeEnum.Enum.GridGroup

export const isColumnGroup = (node: Object3D): node is ColumnGroup =>
  node.userData?.type === UserDataTypeEnum.Enum.ColumnGroup

export const isHouseLayoutGroup = (node: Object3D): node is HouseLayoutGroup =>
  node.userData?.type === UserDataTypeEnum.Enum.HouseLayoutGroup

export const isHouseTransformsGroup = (
  node: Object3D
): node is HouseTransformsGroup =>
  node.userData?.type === UserDataTypeEnum.Enum.HouseTransformsGroup

export const isRotateHandlesGroup = (
  node: Object3D
): node is RotateHandlesGroup =>
  node.userData?.type === UserDataTypeEnum.Enum.RotateHandlesGroup

export const isStretchHandleGroup = (
  node: Object3D
): node is StretchHandleGroup =>
  node.userData?.type === UserDataTypeEnum.Enum.StretchHandleGroup

export const incrementColumnCount = (layoutGroup: Object3D) => {
  const userData = layoutGroup.userData as HouseLayoutGroupUserData
  if (userData.type !== UserDataTypeEnum.Enum.HouseLayoutGroup)
    throw new Error(`incrementColumnCount called on ${userData.type}`)
  userData.columnCount++
}

export const decrementColumnCount = (layoutGroup: Object3D) => {
  const userData = layoutGroup.userData as HouseLayoutGroupUserData
  if (userData.type !== UserDataTypeEnum.Enum.HouseLayoutGroup)
    throw new Error(`incrementColumnCount called on ${userData.type}`)
  userData.columnCount--
}

export const elementMeshToScopeItem = (object: Object3D): ScopeItem => {
  const userData = object.userData as ElementMeshUserData

  if (userData.type !== UserDataTypeEnum.Enum.ElementMesh)
    throw new Error(
      `userData.type is ${userData.type} in elementMeshToScopeItem`
    )

  const { ifcTag } = userData
  const { gridGroupIndex, dna } = object.parent!.userData as ModuleGroupUserData
  const { levelIndex } = object.parent!.parent!.userData as GridGroupUserData
  const { columnIndex } = object.parent!.parent!.parent!
    .userData as ColumnGroupUserData
  const { houseId } = object.parent!.parent!.parent!.parent!.parent!
    .userData as HouseTransformsGroupUserData

  return {
    ifcTag,
    gridGroupIndex,
    levelIndex,
    columnIndex,
    houseId,
    dna,
  }
}
