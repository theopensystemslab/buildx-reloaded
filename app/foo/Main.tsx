"use client"
import ObjectLoader from "@speckle/objectloader"
import { useMemo } from "react"
import { suspend } from "suspend-react"
import { Mesh, MeshBasicMaterial } from "three"
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

  const material = useMemo(() => new MeshBasicMaterial({ color: "tomato" }), [])

  const meshes = useMemo(() => {
    const meshes = ifcParser
      .parse(speckleObject)
      .map((x) => new Mesh(x.geometry, material))

    return meshes
  }, [material, speckleObject])

  return (
    <group>
      {meshes.map(({ geometry, material }, i) => (
        <mesh key={i} geometry={geometry} material={material} />
      ))}
    </group>
  )
}

export default Main
