import { useMaterial } from "~/app/design/state/hashedMaterials"
import { useRef } from "react"
import { Mesh } from "three"
import { HouseElementIdentifier } from "../../state/gestures/drag"
import { useGeometry } from "~/app/design/state/hashedGeometries"
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
