import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { useRef } from "react"
import { Mesh } from "three"
import { ElementIdentifier } from "../../data/elements"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import { useMoveRotateSubscription } from "../../hooks/houses"
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

  useMoveRotateSubscription(houseId, meshRef)

  return (
    <mesh
      ref={meshRef}
      material={material}
      geometry={geometry}
      userData={{
        elementIdentifier: {
          systemId,
          houseId,
          columnIndex,
          levelIndex,
          gridGroupIndex,
          elementName,
        } as ElementIdentifier,
      }}
      // {...(bind() as any)}
    />
  )
}

export default DefaultElement
