import { useEffect, useRef } from "react"
import { BufferGeometry, Mesh } from "three"
import { useMaterial } from "~/design/state/hashedMaterials"
import { PreviewModuleProps } from "./PreviewModule"

type Props = PreviewModuleProps & {
  elementName: string
  geometry: BufferGeometry
}

const PreviewElement = (props: Props) => {
  const { systemId, houseId, elementName, geometry, endColumn } = props

  const meshRef = useRef<Mesh>(null!)

  const material = useMaterial({ systemId, houseId, elementName })

  useEffect(() => {
    meshRef.current.geometry.computeVertexNormals()
  }, [])

  return (
    <mesh
      ref={meshRef}
      material={material}
      geometry={geometry}
      scale-z={endColumn ? 1 : -1}
      castShadow
    />
  )
}

export default PreviewElement
