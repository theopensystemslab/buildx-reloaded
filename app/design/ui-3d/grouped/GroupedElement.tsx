import { useMaterial } from "~/design/state/hashedMaterials"
import { useRef } from "react"
import { BufferGeometry, Mesh } from "three"
import { HouseElementIdentifier } from "../../state/gestures/drag"
import { useGeometry } from "~/design/state/hashedGeometries"
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
