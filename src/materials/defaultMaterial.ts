import { DoubleSide, MeshStandardMaterial } from "three"

const defaultMaterial = new MeshStandardMaterial({
  color: 0xff0000,
  displacementScale: 0, // this can be used to 'explode' the components
  aoMapIntensity: 3.0,
  envMap: null,
  envMapIntensity: 1.5,
  lightMap: null,
  lightMapIntensity: 1,
  emissiveMap: null,
  emissive: 1,
  emissiveIntensity: 1,
  displacementBias: 1,
  roughness: 0.8,
  metalness: 0,
  alphaMap: null,
  bumpScale: 1,
  clippingPlanes: [],
  side: DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  clipIntersection: false,
  shadowSide: DoubleSide,
  clipShadows: true,
  wireframe: false,
  wireframeLinewidth: 1,
  flatShading: false,
  transparent: true,
})

export default defaultMaterial
