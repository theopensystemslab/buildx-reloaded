import { useGeometry } from "@/hooks/hashedGeometries"
import { useMaterial } from "@/hooks/hashedMaterials"
import { useRef } from "react"
import { Mesh } from "three"
import { HouseElementIdentifier } from "../../../hooks/gestures/drag"
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

  const identifier: Partial<HouseElementIdentifier> = {
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
      castShadow
    />
  )
}

export default GroupedStretchElement
