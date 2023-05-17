import { BufferGeometry, BufferAttribute, Vector3, Matrix4 } from "three"

type InputData = {
  faces: number[]
  vertices: number[]
}

const triangleIsCCW = (
  referenceNormal: Vector3,
  a: Vector3,
  b: Vector3,
  c: Vector3
): boolean => {
  const triangleNormal = c.clone().sub(a).cross(b.clone().sub(a))
  triangleNormal.normalize()
  return referenceNormal.dot(triangleNormal) > 0.0
}

const testPointTriangle = (
  v: Vector3,
  a: Vector3,
  b: Vector3,
  c: Vector3
): boolean => {
  const Test = (_v: Vector3, _a: Vector3, _b: Vector3): boolean => {
    const crossA = _v.clone().cross(_a)
    const crossB = _v.clone().cross(_b)
    const dotWithEpsilon = Number.EPSILON + crossA.dot(crossB)
    return Math.sign(dotWithEpsilon) !== -1
  }

  return (
    Test(b.clone().sub(a), v.clone().sub(a), c.clone().sub(a)) &&
    Test(c.clone().sub(b), v.clone().sub(b), a.clone().sub(b)) &&
    Test(a.clone().sub(c), v.clone().sub(c), b.clone().sub(c))
  )
}

const triangulateFace = (
  faceIndex: number,
  faces: number[],
  vertices: number[]
): number[] => {
  let n = faces[faceIndex]
  if (n < 3) n += 3 // 0 -> 3, 1 -> 4

  const asIndex = (v: number): number => faceIndex + v + 1

  const V = (v: number): Vector3 => {
    const index = faces[asIndex(v)] * 3
    return new Vector3(
      vertices[index],
      vertices[index + 1],
      vertices[index + 2]
    )
  }

  const triangleFaces = Array((n - 2) * 3)

  const faceNormal = new Vector3(0, 0, 0)
  for (let ii = n - 1, jj = 0; jj < n; ii = jj, jj++) {
    const iPos = V(ii)
    const jPos = V(jj)
    faceNormal.x += (jPos.y - iPos.y) * (iPos.z + jPos.z) // projection on yz
    faceNormal.y += (jPos.z - iPos.z) * (iPos.x + jPos.x) // projection on xz
    faceNormal.z += (jPos.x - iPos.x) * (iPos.y + jPos.y) // projection on xy
  }
  faceNormal.normalize()

  const prev = Array(n)
  const next = Array(n)
  for (let j = 0; j < n; j++) {
    prev[j] = j - 1
    next[j] = j + 1
  }
  prev[0] = n - 1
  next[n - 1] = 0

  let i = 0
  let counter = 0
  while (n >= 3) {
    let isEar = true

    if (n > 3 && counter < n) {
      const prevVertex = V(prev[i])
      const earVertex = V(i)
      const nextVertex = V(next[i])

      if (triangleIsCCW(faceNormal, prevVertex, earVertex, nextVertex)) {
        let k = next[next[i]]

        do {
          if (testPointTriangle(V(k), prevVertex, earVertex, nextVertex)) {
            isEar = false
            break
          }

          k = next[k]
        } while (k !== prev[i])
      } else {
        isEar = false
      }
    }

    if (isEar) {
      const a = faces[asIndex(i)]
      const b = faces[asIndex(next[i])]
      const c = faces[asIndex(prev[i])]
      triangleFaces.push(a, b, c)

      next[prev[i]] = next[i]
      prev[next[i]] = prev[i]
      n--
      i = prev[i]
      counter = 0
    } else {
      i = next[i]
      counter++
    }
  }

  return triangleFaces
}

const computeVertexNormals = (
  buffer: BufferGeometry,
  doublePositions: Float64Array
): void => {
  const index = buffer.index
  const positionAttribute = buffer.getAttribute("position")

  if (positionAttribute !== undefined) {
    let normalAttribute = buffer.getAttribute("normal")

    if (normalAttribute === undefined) {
      normalAttribute = new BufferAttribute(
        new Float32Array(positionAttribute.count * 3),
        3
      )
      buffer.setAttribute("normal", normalAttribute)
    } else {
      // reset existing normals to zero
      for (let i = 0, il = normalAttribute.count; i < il; i++) {
        normalAttribute.setXYZ(i, 0, 0, 0)
      }
    }

    const pA = new Vector3(),
      pB = new Vector3(),
      pC = new Vector3()
    const nA = new Vector3(),
      nB = new Vector3(),
      nC = new Vector3()
    const cb = new Vector3(),
      ab = new Vector3()

    // indexed elements
    if (index) {
      for (let i = 0, il = index.count; i < il; i += 3) {
        const vA = index.getX(i + 0)
        const vB = index.getX(i + 1)
        const vC = index.getX(i + 2)

        pA.fromArray(doublePositions, vA * 3)
        pB.fromArray(doublePositions, vB * 3)
        pC.fromArray(doublePositions, vC * 3)

        cb.subVectors(pC, pB)
        ab.subVectors(pA, pB)
        cb.cross(ab)

        nA.fromBufferAttribute(normalAttribute, vA)
        nB.fromBufferAttribute(normalAttribute, vB)
        nC.fromBufferAttribute(normalAttribute, vC)

        nA.add(cb)
        nB.add(cb)
        nC.add(cb)

        normalAttribute.setXYZ(vA, nA.x, nA.y, nA.z)
        normalAttribute.setXYZ(vB, nB.x, nB.y, nB.z)
        normalAttribute.setXYZ(vC, nC.x, nC.y, nC.z)
      }
    } else {
      // non-indexed elements (unconnected triangle soup)

      for (let i = 0, il = positionAttribute.count; i < il; i += 3) {
        pA.fromArray(doublePositions, i * 3)
        pB.fromArray(doublePositions, i * 3 + 1)
        pC.fromArray(doublePositions, i * 3 + 2)

        cb.subVectors(pC, pB)
        ab.subVectors(pA, pB)
        cb.cross(ab)

        normalAttribute.setXYZ(i + 0, cb.x, cb.y, cb.z)
        normalAttribute.setXYZ(i + 1, cb.x, cb.y, cb.z)
        normalAttribute.setXYZ(i + 2, cb.x, cb.y, cb.z)
      }
    }

    buffer.normalizeNormals()

    normalAttribute.needsUpdate = true
  }
}

export const convertSpeckleToThree = (input: InputData): BufferGeometry => {
  const indices = []
  let k = 0
  while (k < input.faces.length) {
    let n = input.faces[k]
    if (n < 3) n += 3 // 0 -> 3, 1 -> 4

    if (n === 3) {
      // Triangle face
      indices.push(input.faces[k + 1], input.faces[k + 2], input.faces[k + 3])
    } else {
      // Quad or N-gon face
      const triangulation = triangulateFace(k, input.faces, input.vertices)
      indices.push(
        ...triangulation.filter((el) => {
          return el !== undefined
        })
      )
    }

    k += n + 1
  }

  // Create BufferGeometry from GeometryData
  const buffer = new BufferGeometry()
  buffer.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(input.vertices), 3)
  )
  buffer.setIndex(indices)

  // Rotate geometry from Z-up to Y-up
  buffer.rotateX(-Math.PI / 2)

  // Compute vertex normals
  computeVertexNormals(buffer, new Float64Array(input.vertices))

  return buffer
}
