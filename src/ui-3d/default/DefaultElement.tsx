import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { useEffect, useRef } from "react"
import { Mesh, MeshStandardMaterial, Vector3 } from "three"
import dimensions, { useDimensions } from "../../hooks/dimensions"
import { ElementIdentifier } from "../../hooks/gestures/drag/elements"
import { useGlobals } from "../../hooks/globals"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import houses from "../../hooks/houses"
import { usePostTransientHouseTransforms } from "../../hooks/transients/post"
import { useSetRotation } from "../../utils/three"
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
    mirror,
    moduleZ,
    module,
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

  // useMoveRotateSubscription(houseId, meshRef)

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

  let mirrorFix = mirror ? moduleLength / 2 : -(moduleLength / 2)

  // const setRotation = useSetRotation(houseId)

  const yAxis = new Vector3(0, 1, 0)

  usePostTransientHouseTransforms(
    houseId,
    ({ position: { x: tx, y: ty, z: tz }, rotation }) => {
      if (!meshRef.current) return

      const center = dimensions?.[houseId]?.obb.center ?? new Vector3(0, 0, 0)

      const mirrorFix = mirror ? moduleLength / 2 : -(moduleLength / 2)

      let x = tx,
        y = ty + levelY,
        z = tz + columnZ + moduleZ + mirrorFix

      meshRef.current.scale.set(1, 1, mirror ? 1 : -1)

      meshRef.current.position.set(x, y, z)

      const lengthVector = new Vector3(
        0,
        0,
        (dimensions[houseId]?.length ?? 0) / 2
      )

      meshRef.current.position.sub(lengthVector)
      meshRef.current.position.applyAxisAngle(yAxis, rotation)
      meshRef.current.position.add(lengthVector)

      meshRef.current.rotation.set(0, 0, 0)
      meshRef.current.rotateOnAxis(yAxis, rotation) // rotate the OBJECT
    }
  )

  // const { debug } = useGlobals()

  // useEffect(() => {
  //   let m = material as MeshStandardMaterial
  //   if (debug && !m.wireframe) m.wireframe = true
  //   if (!debug && m.wireframe) m.wireframe = false
  // }, [debug, material])

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
