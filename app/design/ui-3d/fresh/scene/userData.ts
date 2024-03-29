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
import { HouseType } from "../../../../../server/data/houseTypes"
import { LevelType } from "../../../../../server/data/levelTypes"
import { SectionType } from "../../../../../server/data/sectionTypes"
import { WindowType } from "../../../../../server/data/windowTypes"
import { Column, ColumnLayout } from "../../../../db/layouts"
import { ThreeMaterial } from "../../../../utils/three"
import { ScopeElement } from "../../../state/scope"
import { EnrichedMaterial } from "../systems"
import { HandleTypeEnum } from "./houseTransformsGroup"

// HouseTransformsGroup has
// -> HouseTransformsHandlesGroup (rotate and X-Stretch handles)
//   -> HouseTransformsHandlesGroup
//     -> Stretch X Handle meshes
//     -> Rotate Handles group
//       -> Rotate Handles meshes
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

export const LayoutType = z.enum([
  "ACTIVE",
  "ALT_RESET",
  "ALT_SECTION_TYPE",
  "ALT_LEVEL_TYPE",
  "ALT_WINDOW_TYPE",
])

export type LayoutType = z.infer<typeof LayoutType>

export type ActiveLayout = {
  type: typeof LayoutType.Enum.ACTIVE
  houseLayoutGroup: HouseLayoutGroup
}

export const isActiveLayout = (x: Layout): x is ActiveLayout =>
  x.type === LayoutType.Enum.ACTIVE

export type AltLevelTypeLayout = {
  type: typeof LayoutType.Enum.ALT_LEVEL_TYPE
  houseLayoutGroup: HouseLayoutGroup
  target: ScopeElement
  levelType: LevelType
}

export const isAltLevelTypeLayout = (x: Layout): x is AltLevelTypeLayout =>
  x.type === LayoutType.Enum.ALT_LEVEL_TYPE

export type AltWindowTypeLayout = {
  type: typeof LayoutType.Enum.ALT_WINDOW_TYPE
  houseLayoutGroup: HouseLayoutGroup
  target: ScopeElement
  windowType: WindowType
}

export const isAltWindowTypeLayout = (x: Layout): x is AltWindowTypeLayout =>
  x.type === LayoutType.Enum.ALT_WINDOW_TYPE

export type AltResetLayout = {
  type: typeof LayoutType.Enum.ALT_RESET
  houseLayoutGroup: HouseLayoutGroup
  houseType: HouseType
}

export const isAltResetLayout = (x: Layout): x is AltResetLayout =>
  x.type === LayoutType.Enum.ALT_RESET

export type AltSectionTypeLayout = {
  type: typeof LayoutType.Enum.ALT_SECTION_TYPE
  houseLayoutGroup: HouseLayoutGroup
  sectionType: SectionType
}

export const isAltSectionTypeLayout = (x: Layout): x is AltSectionTypeLayout =>
  x.type === LayoutType.Enum.ALT_SECTION_TYPE

export type AltLayout =
  | AltLevelTypeLayout
  | AltWindowTypeLayout
  | AltResetLayout
  | AltSectionTypeLayout

export type Layout = AltLayout | ActiveLayout

export type Layouts = {
  active: ActiveLayout
  preview: AltLayout | null
  alts: AltLayout[]
}

export type HouseTransformsGroupUserData = {
  // props
  type: typeof UserDataTypeEnum.Enum.HouseTransformsGroup
  systemId: string
  houseId: string
  houseTypeId: string
  friendlyName: string
  // materials
  materials: Record<string, EnrichedMaterial> // specification : EnrichedMaterial
  elements: Record<string, Element> // ifcTag : Element ... for material opts/defaults
  activeElementMaterials: Record<string, string> // ifcTag : specification
  resetMaterials: () => void
  pushElement: (element: Element) => ThreeMaterial
  changeMaterial: (ifcTag: string, specification: string) => void
  // clipping planes
  clippingPlanes: Plane[]
  setVerticalCuts: () => void
  setLevelCut: (levelIndex: number | null) => void
  // layouts
  layouts: Layouts
  getActiveLayout: () => ActiveLayout
  getActiveLayoutGroup: () => HouseLayoutGroup
  setActiveLayout: (altLayout: AltLayout) => void
  getVisibleLayout: () => Layout
  setPreviewLayout: (maybeAltLayout: AltLayout | null) => void
  pushAltLayout: (altLayout: AltLayout) => void
  dropAltLayoutsByType: (type: LayoutType) => void
  refreshAltSectionTypeLayouts: () => void
  // refreshAltLevelTypeLayouts: (scopeElement: ScopeElement) => void
  // refreshAltWindowTypeLayouts: (scopeElement: ScopeElement) => void
  refreshAltResetLayout: () => Promise<void>
  // refreshAltWindowTypeLayouts: () => void
  // handle init
  initRotateAndStretchXHandles: () => void
  // handle visibility
  setXStretchHandlesVisible: (bool?: boolean) => void
  setZStretchHandlesVisible: (bool?: boolean) => void
  setRotateHandlesVisible: (bool?: boolean) => void
  switchHandlesVisibility: (value?: HandleTypeEnum | null) => void
  // handle dimension sync
  // updateXStretchHandleLengths: () => void
  updateHandles: () => void
  // collisions
  computeNearNeighbours: (worldGroup?: Group) => HouseTransformsGroup[]
  computeLengthWiseNeighbours: () => HouseTransformsGroup[]
  checkCollisions: (nearNeighbours: HouseTransformsGroup[]) => boolean
  updateTransforms: () => void
  // exports
  updateExportModels: () => void
  // database
  updateDB: () => Promise<void>
  addToDB: () => Promise<void>
  deleteHouse: () => void
}

export type HouseTransformsHandlesGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.HouseTransformsHandlesGroup
}

export type HouseLayoutGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.HouseLayoutGroup
  dnas: string[]
  houseLayout: ColumnLayout
  vanillaColumn: Column
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
  updateZStretchHandles: () => void
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
  z: number
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
  update: () => void
}

export type StretchHandleMeshUserData = {
  type: typeof UserDataTypeEnum.Enum.StretchHandleMesh
}

export type RotateHandlesGroupUserData = {
  type: typeof UserDataTypeEnum.Enum.RotateHandlesGroup
  update: () => void
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
    moduleIndex: gridGroupIndex,
    levelIndex,
    columnIndex,
    houseId,
    dna,
    object,
  }
}
