import { useMaterial } from "@/hooks/hashedMaterials"
import { useRef } from "react"
import { Mesh } from "three"
import { useGeometry } from "@/hooks/hashedGeometries"
import { PhonyModuleProps } from "./PhonyModule"

type Props = PhonyModuleProps & {
  elementName: string
  geometryHash: string
}

const PhonyElement = (props: Props) => {
  const { systemId, houseId, elementName, geometryHash } = props

  const meshRef = useRef<Mesh>(null!)

  const geometry = useGeometry(geometryHash)
  const material = useMaterial({ systemId, houseId, elementName })

  return (
    <mesh ref={meshRef} material={material} geometry={geometry} castShadow />
  )
}

export default PhonyElement
