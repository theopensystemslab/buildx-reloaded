import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { useRef } from "react"
import { Mesh, Vector3 } from "three"
import dimensions, { getHalfHouseLength } from "../../hooks/dimensions"
import { ElementIdentifier } from "../../hooks/gestures/drag/elements"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import { usePostTransientHouseTransforms } from "../../hooks/transients/post"
import { sign } from "../../utils/math"
import { yAxis } from "../../utils/three"
import { ModuleProps } from "./DefaultModule"

type Props = ModuleProps & {
  elementName: string
  geometryHash: string
}

const DefaultElement = (props: Props) => {
  const meshRef = useRef<Mesh>(null)
  const {
    systemId,
    houseId,
    elementName,
    geometryHash,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    columnZ,
    levelY,
    moduleZ,
    module,
    startColumn,
    endColumn,
  } = props

  const materialHash = useMaterialHash({
    systemId,
    houseId,
    elementName,
    visible: true,
    clippingPlanes: [],
  })

  const geometry = useHashedGeometry(geometryHash)
  const material = useHashedMaterial(materialHash)

  const identifier: ElementIdentifier = {
    identifierType: "element",
    systemId,
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    elementName,
  }

  const moduleLength = module.length

  const mirror = endColumn

  usePostTransientHouseTransforms(
    houseId,
    ({ position: { x: tx, y: ty, z: tz }, rotation }) => {
      if (!meshRef.current) return

      // this is crazy
      const mirrorFix = mirror ? moduleLength / 2 : -(moduleLength / 2)
      const halfHouseLength = getHalfHouseLength(houseId)
      meshRef.current.scale.set(1, 1, mirror ? 1 : -1)
      meshRef.current.position.set(
        0,
        levelY,
        columnZ + moduleZ + mirrorFix - halfHouseLength
      )
      meshRef.current.setRotationFromAxisAngle(yAxis, rotation)
      meshRef.current.position.applyAxisAngle(yAxis, rotation)
      meshRef.current.position.add(new Vector3(tx, ty, tz + halfHouseLength))
      // to here; order of operations super important
    }
  )

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

export default DefaultElement
