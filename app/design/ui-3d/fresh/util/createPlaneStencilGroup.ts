import {
  AlwaysStencilFunc,
  BackSide,
  BufferGeometry,
  DecrementWrapStencilOp,
  FrontSide,
  Group,
  IncrementWrapStencilOp,
  Mesh,
  MeshBasicMaterial,
  Plane,
} from "three"

const createPlaneStencilGroup = (
  geometry: BufferGeometry,
  plane: Plane,
  renderOrder: number
): Group => {
  const group = new Group()
  const baseMat = new MeshBasicMaterial()
  baseMat.depthWrite = false
  baseMat.depthTest = false
  baseMat.colorWrite = false
  baseMat.stencilWrite = true
  baseMat.stencilFunc = AlwaysStencilFunc

  // back faces
  const mat0 = baseMat.clone()
  mat0.side = BackSide
  mat0.clippingPlanes = [plane]
  mat0.stencilFail = IncrementWrapStencilOp
  mat0.stencilZFail = IncrementWrapStencilOp
  mat0.stencilZPass = IncrementWrapStencilOp

  const mesh0 = new Mesh(geometry, mat0)
  mesh0.renderOrder = renderOrder
  group.add(mesh0)

  // front faces
  const mat1 = baseMat.clone()
  mat1.side = FrontSide
  mat1.clippingPlanes = [plane]
  mat1.stencilFail = DecrementWrapStencilOp
  mat1.stencilZFail = DecrementWrapStencilOp
  mat1.stencilZPass = DecrementWrapStencilOp

  const mesh1 = new Mesh(geometry, mat1)
  mesh1.renderOrder = renderOrder

  group.add(mesh1)

  return group
}
// const createPlaneStencilGroup = (
//   geometry: BufferGeometry,
//   plane: Plane,
//   renderOrder: number
// ): Group => {
//   const group = new Group()
//   const baseMat = new MeshBasicMaterial()
//   baseMat.depthWrite = false
//   baseMat.depthTest = false
//   baseMat.colorWrite = false
//   baseMat.stencilWrite = true
//   baseMat.stencilFunc = AlwaysStencilFunc

//   // back faces
//   const mat0 = baseMat.clone()
//   mat0.side = BackSide
//   mat0.clippingPlanes = [plane]
//   mat0.stencilFail = IncrementWrapStencilOp
//   mat0.stencilZFail = IncrementWrapStencilOp
//   mat0.stencilZPass = IncrementWrapStencilOp

//   const mesh0 = new Mesh(geometry, mat0)
//   mesh0.renderOrder = renderOrder
//   group.add(mesh0)

//   // front faces
//   const mat1 = baseMat.clone()
//   mat1.side = FrontSide
//   mat1.clippingPlanes = [plane]
//   mat1.stencilFail = DecrementWrapStencilOp
//   mat1.stencilZFail = DecrementWrapStencilOp
//   mat1.stencilZPass = DecrementWrapStencilOp

//   const mesh1 = new Mesh(geometry, mat1)
//   mesh1.renderOrder = renderOrder

//   group.add(mesh1)

//   return group
// }

export default createPlaneStencilGroup
