import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { useRef } from "react"
import { Mesh, Vector3 } from "three"
import { useHalfHouseLength } from "../../hooks/dimensions"
import { ElementIdentifier } from "../../hooks/gestures/drag/elements"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import { ModuleProps } from "./GroupedModule"

type Props = ModuleProps & {
  elementName: string
  geometryHash: string
}

const GroupedElement = (props: Props) => {
  const meshRef = useRef<Mesh>(null)
  const {
    systemId,
    houseId,
    elementName,
    geometryHash,
    columnIndex,
    levelIndex,
    gridGroupIndex,
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

  const positionVector = useRef(new Vector3())

  const halfHouseLength = useHalfHouseLength(houseId)

  // usePostTransientHouseTransforms(
  //   houseId,
  //   ({ position: { x: tx, y: ty, z: tz }, rotation }) => {
  //     if (!meshRef.current) return

  //     // module transforms (depending on if end column)
  //     const mirrorFix = end ? moduleLength / 2 : -(moduleLength / 2)
  //     meshRef.current.scale.set(1, 1, end ? 1 : -1)
  //     meshRef.current.position.set(
  //       0,
  //       levelY,
  //       columnZ + moduleZ + mirrorFix - halfHouseLength
  //     )

  //     meshRef.current.setRotationFromAxisAngle(yAxis, rotation)
  //     meshRef.current.position.applyAxisAngle(yAxis, rotation)

  //     meshRef.current.position.add(new Vector3(tx, ty, tz + halfHouseLength))
  //     // to here; order of operations super important

  //     positionVector.current.copy(meshRef.current.position)
  //   }
  // )

  // useSubscribeKey(postTransients, houseId, () => {
  //   if (!meshRef.current) return
  //   if (!postTransients[houseId]?.stretch) {
  //     meshRef.current.position.copy(positionVector.current)
  //     return
  //   }

  //   const { dx, dz, side } = postTransients[houseId].stretch!

  //   if (side === HandleSideEnum.Enum.FRONT && !start) return
  //   if (side === HandleSideEnum.Enum.BACK && !end) return

  //   meshRef.current.position.copy(positionVector.current)
  //   meshRef.current.position.add(new Vector3(dx, 0, dz))
  // })

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

export default GroupedElement
