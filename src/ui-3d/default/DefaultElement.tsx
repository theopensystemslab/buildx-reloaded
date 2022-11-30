import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { useEffect, useRef } from "react"
import { Mesh, MeshStandardMaterial } from "three"
import { ElementIdentifier } from "../../hooks/gestures/drag/elements"
import { useGlobals } from "../../hooks/globals"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import { usePostTransientHouseTransforms } from "../../hooks/transients/post"
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

  usePostTransientHouseTransforms(
    houseId,
    ({ position: { x, y, z }, rotation }) => {
      meshRef.current?.position.set(x, y + levelY, z + columnZ + moduleZ)
      meshRef.current?.rotation.set(0, rotation, 0)
    }
  )

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
