"use client"
import ObjectLoader from "@speckle/objectloader"
import { useMemo } from "react"
import { suspend } from "suspend-react"
import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial } from "three"
import ifcParser from "./ifcParser"

const Main = () => {
  const speckleObject: any = suspend(async () => {
    let loader = new ObjectLoader({
      serverUrl: "https://speckle.xyz",
      streamId: "3616f2f9fb",
      objectId: "9f798d821d7b9d1901828fe5880885b1",
    })

    return await loader.getAndConstructObject(() => {})
  }, [])

  const meshes = useMemo(() => {
    const meshes: Mesh[] = []

    console.log({ speckleObject })

    const foo = ifcParser.parse(speckleObject)

    console.log(foo)

    // speckleObject.children[0].children.forEach((child: any) => {
    //   console.log(child)
    //   if (
    //     child?.["@displayValue"]?.[0]?.speckle_type !== "Objects.Geometry.Mesh"
    //   )
    //     return

    //   const { faces, vertices } = child?.["@displayValue"]?.[0]

    //   const geometry = new BufferGeometry()
    //   const verticesArray = new Float32Array(vertices)
    //   geometry.setAttribute("position", new BufferAttribute(verticesArray, 3))
    //   const facesArray = new Uint32Array(faces)
    //   geometry.setIndex(new BufferAttribute(facesArray, 1))
    //   const material = new MeshBasicMaterial({
    //     color: 0xffffff,
    //     wireframe: true,
    //   })

    //   const mesh = new Mesh(geometry, material)

    //   meshes.push(mesh)
    // })

    return meshes
  }, [speckleObject])

  return (
    <group>
      {meshes.map(({ geometry, material }, i) => (
        <mesh key={i} geometry={geometry} material={material} />
      ))}
    </group>
  )
}

export default Main
