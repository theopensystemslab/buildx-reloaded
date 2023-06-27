import { useEffect, useRef } from "react"
import { BufferGeometry, Mesh } from "three"
import { useMaterial } from "~/design/state/hashedMaterials"
import { HouseElementIdentifier } from "../../../state/gestures/drag"
import { StretchModuleProps } from "./GroupedStretchModule"

type Props = StretchModuleProps & {
  elementName: string
  geometry: BufferGeometry
}

const GroupedStretchElement = (props: Props) => {
  const { systemId, houseId, elementName, geometry } = props

  const meshRef = useRef<Mesh>(null!)

  const material = useMaterial({ systemId, houseId, elementName })

  const identifier: Partial<HouseElementIdentifier> = {
    systemId,
    houseId,
    elementName,
  }

  useEffect(() => {
    meshRef.current.geometry.computeVertexNormals()
  }, [])

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
