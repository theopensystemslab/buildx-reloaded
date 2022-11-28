import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { useEffect, useRef } from "react"
import { useKey } from "react-use"
import { Mesh, MeshStandardMaterial } from "three"
import { ElementIdentifier } from "../../hooks/gestures/drag/elements"
import { useGlobals } from "../../hooks/globals"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import { useElementTransforms } from "../../hooks/transients"
import { PI } from "../../utils/math"
import { useSetRotation } from "../../utils/three"
import { ModuleProps } from "./DefaultModule"

type Props = ModuleProps & {
  elementName: string
  geometryHash: string
}

const DefaultElement = (props: Props) => {
  const meshRef = useRef<Mesh>(null)
  const {
    systemId,
    houseId,
    elementName,
    geometryHash,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    columnZ,
    levelY,
    mirror,
    moduleZ,
    module,
  } = props

  const materialHash = useMaterialHash({
    systemId,
    houseId,
    elementName,
    visible: true,
    clippingPlanes: [],
  })

  const geometry = useHashedGeometry(geometryHash)
  const material = useHashedMaterial(materialHash)

  // useMoveRotateSubscription(houseId, meshRef)

  const identifier: ElementIdentifier = {
    identifierType: "element",
    systemId,
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    elementName,
  }

  useElementTransforms(meshRef, {
    identifier,
    columnZ,
    levelY,
    moduleZ,
    moduleLength: module.length,
    mirror,
  })

  // const setRotation = useSetRotation(houseId)

  // useKey("r", () => {
  //   if (!meshRef.current) return
  //   setRotation(meshRef.current, PI / 8)
  // })
  // useKey("i", () => {
  //   if (!meshRef.current) return
  //   setRotation(meshRef.current, 0)
  // })

  const { debug } = useGlobals()

  useEffect(() => {
    let m = material as MeshStandardMaterial
    if (debug && !m.wireframe) m.wireframe = true
    if (!debug && m.wireframe) m.wireframe = false
  }, [debug, material])

  return (
    <mesh
      ref={meshRef}
      material={material}
      geometry={geometry}
      userData={{
        identifier,
      }}
    />
  )
}

export default DefaultElement
