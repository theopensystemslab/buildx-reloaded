import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { useRef } from "react"
import { Mesh, Vector3 } from "three"
import dimensions from "../../hooks/dimensions"
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
    ({ position: { x: tx, y: ty, z: tz }, rotation, stretchLengthUnits }) => {
      if (!meshRef.current) return

      const mirrorFix = mirror ? moduleLength / 2 : -(moduleLength / 2)

      const center = dimensions?.[houseId]?.obb?.center ?? new Vector3(0, 0, 0)

      const halfHouseLength = (dimensions[houseId]?.length ?? 0) / 2

      meshRef.current.rotation.set(0, 0, 0)
      meshRef.current.position.set(0, 0, 0)
      meshRef.current.scale.set(1, 1, mirror ? 1 : -1)

      let x = tx,
        y = ty + levelY,
        z = tz + columnZ + moduleZ + mirrorFix

      meshRef.current.position.set(x, y, z)

      const offsetVector = new Vector3(center.x, 0, center.z - halfHouseLength)

      // position relative to center and rotate position
      meshRef.current.position.sub(offsetVector)
      meshRef.current.position.applyAxisAngle(yAxis, rotation)

      // remove offset needed for rotation
      meshRef.current.position.add(offsetVector)

      meshRef.current.rotation.set(0, rotation, 0)
      // meshRef.current.rotateOnAxis(yAxis, rotation)

      if (startColumn && sign(stretchLengthUnits) === -1) {
        // vector is stretch length units + the rotation
        // meshRef.current.position.add()
      }

      if (endColumn && sign(stretchLengthUnits) === 1) {
      }
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
