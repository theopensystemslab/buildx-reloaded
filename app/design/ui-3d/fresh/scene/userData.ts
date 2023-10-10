import {
  Box3,
  BufferGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Plane,
} from "three"
import { OBB } from "three-stdlib"
import { z } from "zod"
import { Element } from "../../../../../server/data/elements"
import { ColumnLayout, VanillaColumn } from "../../../../db/layouts"
import { O } from "../../../../utils/functions"
import { ThreeMaterial } from "../../../../utils/three"
import { ScopeElement } from "../../../state/scope"
import { EnrichedMaterial } from "../systems"

// HouseTransformsGroup has
// -> HouseTransformsHandlesGroup (rotate and X-Stretch handles)
//   -> Stretch X Handle groups
//     -> Stretch X Handle meshes
//   -> Rotate Handles group
//     -> Rotate Handles meshes
//   -> HouseLayoutGroup's as children
//      (alternative layouts;
//         visibility/raycasting disabled
//           except 1)
//     -> ColumnsGroup's as children have
//       -> GridGroup's as children have
//       -> Z-Stretch handles (special case)
//         -> ModuleGroup's as children have
//           -> ElementMesh's as children

export const UserDataTypeEnum = z.enum([
  "HouseTransformsGroup",
  "HouseTransformsHandlesGroup",
  "HouseLayoutGroup",
  "ColumnGroup",
  // layout group handles go in start/end column groups
  //   this is a special case for stretch Z handles
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
  // props
  type: typeof UserDataTypeEnum.Enum.HouseTransformsGroup
  systemId: string
  houseId: string
  houseTypeId: string
  friendlyName: string
  clippingPlanes: Plane[]
  activeLayoutGroupUuid: string
  activeLayoutDnas: string[]
  materials: Record<string, EnrichedMaterial> // specification : EnrichedMaterial
  elements: Record<string, Element> // ifcTag : Element ... for material opts/defaults
  activeElementMaterials: Record<string, string> // ifcTag : specification
  // materials
  resetMaterials: () => void
  pushElement: (element: Element) => ThreeMaterial
  changeMaterial: (ifcTag: string, specification: string) => void
  // layouts
  updateActiveLayoutDnas: (x: string[]) => void
  getActiveLayoutGroup: () => O.Option<HouseLayoutGroup>
  unsafeGetActiveLayoutGroup: () => HouseLayoutGroup
  setActiveLayoutGroup: (layoutGroup: HouseLayoutGroup) => void
  refreshAltSectionTypeLayouts: () => void
  // handles
  updateXStretchHandleLengths: () => void
  setXStretchHandlesVisible: (bool?: boolean) => void
  setZStretchHandlesVisible: (bool?: boolean) => void
  setRotateHandlesVisible: (bool?: boolean) => void
  initRotateAndStretchXHandles: () => void
  updateHandlesGroupZ: () => void
  // collisions
  computeNearNeighbours: (worldGroup?: Group) => HouseTransformsGroup[]
  computeLengthWiseNeighbours: () => HouseTransformsGroup[]
  checkCollisions: (nearNeighbours: HouseTransformsGroup[]) => boolean
  updateTransforms: () => void
  // database
  updateDB: () => Promise<void>
  addToDB: () => Promise<void>
  deleteHouse: () => void
}

export type HouseTransformsHandlesGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.HouseTransformsHandlesGroup
}

export const HouseLayoutGroupUse = z.enum([
  "INITIAL",
  "RESET",
  "ALT_SECTION_TYPE",
  "ALT_LEVEL_TYPE",
])
export type HouseLayoutGroupUse = z.infer<typeof HouseLayoutGroupUse>

export type HouseLayoutGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.HouseLayoutGroup
  use: HouseLayoutGroupUse
  dnas: string[]
  houseLayout: ColumnLayout
  vanillaColumn: VanillaColumn
  levelTypes: string[]
  obb: OBB
  aabb: Box3
  height: number
  length: number
  width: number
  activeColumnGroupCount: number
  sectionType: string
  initStretchZHandles: () => void
  updateLength: () => void
  updateActiveColumnGroupCount: (n: number) => void
  updateDnas: () => void
  updateBBs: () => void
  renderBBs: () => void
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

export const ModuleGroupUse = z.enum(["INITIAL", "ALT_WINDOW_TYPE"])

export type ModuleGroupUse = z.infer<typeof ModuleGroupUse>

export type ModuleGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.ModuleGroup
  gridGroupIndex: number
  dna: string
  length: number
  z: number
  use: ModuleGroupUse
  setThisModuleGroupVisible: () => void
}

export type ElementMeshUserData = {
  type: typeof UserDataTypeEnum.Enum.ElementMesh
  ifcTag: string
  category: string
}

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

export type UserData =
  | ElementMeshUserData
  | ModuleGroupUserData
  | GridGroupUserData
  | ColumnGroupUserData
  | HouseLayoutGroupUserData
  | HouseTransformsGroupUserData
  | HouseTransformsHandlesGroupUserData
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

export type HouseTransformsHandlesGroup = Group & {
  userData: HouseTransformsHandlesGroupUserData
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

export const isActiveLayoutGroup = (node: Object3D): node is HouseLayoutGroup =>
  isHouseLayoutGroup(node) &&
  node.uuid ===
    (node.parent as HouseTransformsGroup).userData.activeLayoutGroupUuid

export const isHouseTransformsGroup = (
  node: Object3D
): node is HouseTransformsGroup =>
  node.userData?.type === UserDataTypeEnum.Enum.HouseTransformsGroup

export const isHouseTransformsHandlesGroup = (
  node: Object3D
): node is HouseTransformsHandlesGroup =>
  node.userData?.type === UserDataTypeEnum.Enum.HouseTransformsHandlesGroup

export const isRotateHandlesGroup = (
  node: Object3D
): node is RotateHandlesGroup =>
  node.userData?.type === UserDataTypeEnum.Enum.RotateHandlesGroup

export const isStretchHandleGroup = (
  node: Object3D
): node is StretchHandleGroup =>
  node.userData?.type === UserDataTypeEnum.Enum.StretchHandleGroup

export const isXStretchHandleGroup = (
  node: Object3D
): node is StretchHandleGroup =>
  isStretchHandleGroup(node) && node.userData.axis === "x"

export const isZStretchHandleGroup = (
  node: Object3D
): node is StretchHandleGroup =>
  isStretchHandleGroup(node) && node.userData.axis === "z"

export const elementMeshToScopeItem = (object: Object3D): ScopeElement => {
  if (!isElementMesh(object))
    throw new Error(`called elementMeshToScopeItem on non ElementMesh`)

  const { ifcTag } = object.userData
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
    object,
  }
}
