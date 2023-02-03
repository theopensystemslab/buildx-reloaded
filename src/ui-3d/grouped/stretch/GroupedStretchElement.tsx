import { useGeometry } from "@/hooks/hashedGeometries"
import { useMaterial } from "@/hooks/hashedMaterials"
import { useRef } from "react"
import { Mesh } from "three"
import { ElementIdentifier } from "../../../hooks/gestures/drag/elements"
import { StretchModuleProps } from "./GroupedStretchModule"

type Props = StretchModuleProps & {
  elementName: string
  geometryHash: string
}

const GroupedStretchElement = (props: Props) => {
  const { systemId, houseId, elementName, geometryHash } = props

  const meshRef = useRef<Mesh>(null)

  const geometry = useGeometry(geometryHash)
  const material = useMaterial({ systemId, houseId, elementName })

  const identifier: Partial<ElementIdentifier> = {
    identifierType: "element",
    systemId,
    houseId,
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
    />
  )
}

export default GroupedStretchElement
