import { useMaterial } from "@/hooks/hashedMaterials"
import { useRef } from "react"
import { Mesh } from "three"
import { ElementIdentifier } from "../../hooks/gestures/drag/elements"
import { useGeometry } from "../../hooks/hashedGeometries"
import { ModuleProps } from "./GroupedModule"

type Props = ModuleProps & {
  elementName: string
  geometryHash: string
}

const GroupedElement = (props: Props) => {
  const {
    systemId,
    houseId,
    elementName,
    geometryHash,
    columnIndex,
    levelIndex,
    gridGroupIndex,
  } = props

  const meshRef = useRef<Mesh>(null!)

  const geometry = useGeometry(geometryHash)
  const material = useMaterial({ systemId, houseId, elementName })

  const identifier: ElementIdentifier = {
    identifierType: "element",
    systemId,
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    elementName,
  }

  return (
    <mesh
      ref={meshRef}
      material={material}
      geometry={geometry}
      userData={{
        identifier,
      }}
      castShadow
    />
  )
}

export default GroupedElement
