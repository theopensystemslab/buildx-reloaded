import { useRef } from "react"
import { BufferGeometry, Mesh } from "three"
import { useMaterial } from "~/design/state/hashedMaterials"
import { PreviewModuleProps } from "./PreviewModule"

type Props = PreviewModuleProps & {
  elementName: string
  geometry: BufferGeometry
}

const PreviewElement = (props: Props) => {
  const { systemId, houseId, elementName, geometry } = props

  const meshRef = useRef<Mesh>(null!)

  const material = useMaterial({ systemId, houseId, elementName })

  return (
    <mesh ref={meshRef} material={material} geometry={geometry} castShadow />
  )
}

export default PreviewElement
