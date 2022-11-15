import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { useRef } from "react"
import { Mesh } from "three"
import { ElementIdentifier } from "../../data/elements"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import { useMoveRotateSubscription } from "../../hooks/houses"
import { useElementTransforms } from "../../hooks/transients"
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

  const elementIdentifier: ElementIdentifier = {
    systemId,
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    elementName,
  }

  useElementTransforms(meshRef, {
    elementIdentifier,
    columnZ,
    levelY,
    moduleZ,
    moduleLength: module.length,
    mirror,
  })

  return (
    <mesh
      ref={meshRef}
      material={material}
      geometry={geometry}
      userData={{
        elementIdentifier,
      }}
      // position={[
      //   0,
      //   levelY,
      //   mirror
      //     ? columnZ + moduleZ + module.length / 2
      //     : columnZ + moduleZ - module.length / 2,
      // ]}
      // scale={[1, 1, mirror ? 1 : -1]}
    />
  )
}

export default DefaultElement
