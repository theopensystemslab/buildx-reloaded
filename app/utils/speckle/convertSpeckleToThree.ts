import {
  BufferGeometry,
  Float32BufferAttribute,
  Uint32BufferAttribute,
  Vector3,
} from "three"

type InputData = {
  faces: number[]
  vertices: number[]
}

export function convertSpeckleToThree(input: InputData): BufferGeometry {
  const geometry = new BufferGeometry()

  const { faces, vertices } = input
  const indices: number[] = []

  function triangleIsCCW(
    referenceNormal: Vector3,
    a: Vector3,
    b: Vector3,
    c: Vector3
  ): boolean {
    const triangleNormal = c.sub(a).cross(b.sub(a))
    triangleNormal.normalize()
    return referenceNormal.dot(triangleNormal) > 0.0
  }

  function testPointTriangle(
    v: Vector3,
    a: Vector3,
    b: Vector3,
    c: Vector3
  ): boolean {
    function Test(_v: Vector3, _a: Vector3, _b: Vector3): boolean {
      const crossA = _v.cross(_a)
      const crossB = _v.cross(_b)
      const dotWithEpsilon = Number.EPSILON + crossA.dot(crossB)
      return Math.sign(dotWithEpsilon) !== -1
    }

    return (
      Test(b.sub(a), v.sub(a), c.sub(a)) &&
      Test(c.sub(b), v.sub(b), a.sub(b)) &&
      Test(a.sub(c), v.sub(c), b.sub(c))
    )
  }

  function triangulateFace(
    faceIndex: number,
    faces: number[],
    vertices: number[]
  ): number[] {
    let n = faces[faceIndex]
    if (n < 3) n += 3

    function asIndex(v: number): number {
      return faceIndex + v + 1
    }

    function V(v: number): Vector3 {
      const index = faces[asIndex(v)] * 3
      return new Vector3(
        vertices[index],
        vertices[index + 1],
        vertices[index + 2]
      )
    }

    const triangleFaces: number[] = Array((n - 2) * 3)

    const faceNormal = new Vector3(0, 0, 0)
    for (let ii = n - 1, jj = 0; jj < n; ii = jj, jj++) {
      const iPos = V(ii)
      const jPos = V(jj)
      faceNormal.x += (jPos.y - iPos.y) * (iPos.z + jPos.z) // projection on yz
      faceNormal.y += (jPos.z - iPos.z) * (iPos.x + jPos.x) // projection on xz
      faceNormal.z += (jPos.x - iPos.x) * (iPos.y + jPos.y) // projection on xy
    }
    faceNormal.normalize()

    //Set up previous and next links to effectively form a double-linked vertex list
    const prev = Array(n)
    const next = Array(n)
    for (let j = 0; j < n; j++) {
      prev[j] = j - 1
      next[j] = j + 1
    }
    prev[0] = n - 1
    next[n - 1] = 0

    //Start clipping ears until we are left with a triangle
    let i = 0
    let counter = 0
    while (n >= 3) {
      let isEar = true

      //If we are the last triangle or we have exhausted our vertices, the below statement will be false
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

  let k = 0
  while (k < faces.length) {
    let n = faces[k]
    if (n < 3) n += 3

    if (n === 3) {
      indices.push(faces[k + 1], faces[k + 2], faces[k + 3])
    } else {
      const triangulation = triangulateFace(k, faces, vertices)
      indices.push(...triangulation)
    }

    k += n + 1
  }

  const transformedVertices = vertices.map((_, index) => {
    switch (index % 3) {
      case 1:
        return vertices[index + 1]
      case 2:
        return vertices[index - 1]
      default:
        return vertices[index]
    }
  })

  geometry.setIndex(new Uint32BufferAttribute(indices, 1))
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(transformedVertices, 3)
  )

  return geometry
}
