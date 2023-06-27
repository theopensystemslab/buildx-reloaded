import { useEffect, useRef } from "react"
import { BufferGeometry, Mesh } from "three"
import { useMaterial } from "~/design/state/hashedMaterials"
import { HouseElementIdentifier } from "../../state/gestures/drag"
import { ModuleProps } from "./GroupedModule"

type Props = ModuleProps & {
  elementName: string
  geometry: BufferGeometry
}

const GroupedElement = (props: Props) => {
  const {
    systemId,
    houseId,
    elementName,
    geometry,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    endColumn,
  } = props

  const meshRef = useRef<Mesh>(null!)

  const material = useMaterial({ systemId, houseId, elementName })

  const identifier: HouseElementIdentifier = {
    identifierType: "HOUSE_ELEMENT",
    systemId,
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
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
      name={identifier.toString()}
      scale={endColumn ? [1, 1, 1] : [1, 1, -1]}
      castShadow
    />
  )
}

export default GroupedElement
