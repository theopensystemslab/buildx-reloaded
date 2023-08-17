import {
  Mesh,
  Shape,
  ExtrudeGeometry,
  MeshStandardMaterial,
  Material,
} from "three"
import { toCreasedNormals } from "three-stdlib"

const eps = 0.00001

const createShape = (width: number, height: number, radius0: number): Shape => {
  const shape = new Shape()
  const radius = radius0 - eps
  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true)
  shape.absarc(eps, height - radius * 2, eps, Math.PI, Math.PI / 2, true)
  shape.absarc(
    width - radius * 2,
    height - radius * 2,
    eps,
    Math.PI / 2,
    0,
    true
  )
  shape.absarc(width - radius * 2, eps, eps, 0, -Math.PI / 2, true)
  return shape
}

interface RoundedBoxMeshOptions {
  width?: number
  height?: number
  depth?: number
  radius?: number
  steps?: number
  smoothness?: number
  creaseAngle?: number
  material?: Material
}

const createRoundedBoxMesh = ({
  width = 1,
  height = 1,
  depth = 1,
  radius = 0.05,
  steps = 1,
  smoothness = 4,
  creaseAngle = 0.4,
  material = new MeshStandardMaterial({ color: 0xffffff }),
}: RoundedBoxMeshOptions = {}): Mesh => {
  const shape = createShape(width, height, radius)
  const params = {
    depth: depth - radius * 2,
    bevelEnabled: true,
    bevelSegments: smoothness * 2,
    steps,
    bevelSize: radius - eps,
    bevelThickness: radius,
    curveSegments: smoothness,
  }

  const geometry = new ExtrudeGeometry(shape, params)
  geometry.center()
  toCreasedNormals(geometry, creaseAngle)

  return new Mesh(geometry, material)
}

export default createRoundedBoxMesh
