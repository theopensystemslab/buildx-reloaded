import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { useEffect, useRef } from "react"
import { Mesh, Vector3 } from "three"
import { useHouseLength } from "@/hooks/dimensions"
import { HandleSideEnum } from "@/hooks/gestures/drag/handles"
import { useHashedGeometry } from "@/hooks/hashedGeometries"
import { useHouse } from "@/hooks/houses"
import { useStretch, useVanillaColumnLength } from "@/hooks/layouts"
import postTransients from "@/hooks/transients/post"
import { useSubscribeKey } from "@/utils/hooks"
import { ceil, floor } from "@/utils/math"
import { yAxis } from "@/utils/three"
import { StretchModuleProps } from "./GroupedStretchModule"

type Props = StretchModuleProps & {
  elementName: string
  geometryHash: string
}

const GroupedStretchElement = (props: Props) => {
  const {
    systemId,
    houseId,
    elementName,
    geometryHash,
    levelIndex,
    gridGroupIndex,
    module,
    levelY,
  } = props

  const meshRef = useRef<Mesh>(null)

  const materialHash = useMaterialHash({
    systemId,
    houseId,
    elementName,
    visible: true,
    clippingPlanes: [],
  })

  const geometry = useHashedGeometry(geometryHash)
  const material = useHashedMaterial(materialHash)

  // return useStretchInstance({
  //   systemId,
  //   houseId,
  //   geometryHash,
  //   materialHash,
  //   columnZ,
  //   levelY,
  // })

  // const parent = useStretchElementInstanceParent(geometryHash, materialHash)

  // return <Fragment>{createPortal(<Instance />, parent)}</Fragment>

  // const elementIdentifier: ElementIdentifier = {
  //   systemId,
  //   houseId,
  //   columnIndex,
  //   levelIndex,
  //   gridGroupIndex,
  //   elementName,
  // }

  // const { position, rotation } = useHouse(houseId)

  // const { startColumn, endColumn } = useStretch(houseId)
  // const vanillaColumnLength = useVanillaColumnLength(houseId)

  // const houseLength = useHouseLength(houseId)

  // useEffect(() => {
  //   if (!meshRef.current) return

  //   const { x, y, z } = position

  //   const mirrorFix = module.length / 2
  //   const halfHouseLength = houseLength / 2
  //   meshRef.current.position.set(
  //     0,
  //     levelY,
  //     mirrorFix -
  //       halfHouseLength +
  //       (side === HandleSideEnum.Enum.FRONT
  //         ? 0
  //         : houseLength - endColumn.length - startColumn.length)
  //   )
  //   meshRef.current.setRotationFromAxisAngle(yAxis, rotation)
  //   meshRef.current.position.applyAxisAngle(yAxis, rotation)
  //   meshRef.current.position.add(new Vector3(x, y, z + halfHouseLength))
  // }, [
  //   endColumn.length,
  //   houseId,
  //   houseLength,
  //   levelY,
  //   module.length,
  //   position,
  //   rotation,
  //   side,
  //   startColumn.length,
  // ])

  // useSubscribeKey(postTransients, houseId, () => {
  //   if (!postTransients[houseId]?.stretch) return
  //   const { distance } = postTransients[houseId].stretch!
  //   const f = side === HandleSideEnum.Enum.BACK ? ceil : floor
  //   const z = f(distance / vanillaColumnLength)
  //   meshRef.current?.scale.setZ(-z)
  //   // meshRef.current?.scale.setZ(0)
  // })

  return <mesh ref={meshRef} material={material} geometry={geometry} />
}

export default GroupedStretchElement
