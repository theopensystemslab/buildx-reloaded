import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { Instance } from "@react-three/drei"
import { createPortal } from "@react-three/fiber"
import { Fragment, useEffect, useRef, useState } from "react"
import { Mesh, Vector3 } from "three"
import { getHalfHouseLength, getHouseLength } from "../../hooks/dimensions"
import { HandleSideEnum } from "../../hooks/gestures/drag/handles"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import { useHouse } from "../../hooks/houses"
import { useStretch, useVanillaColumnLength } from "../../hooks/layouts"
import stretchProxy from "../../hooks/stretch"
import { useStretchInstance } from "../../hooks/stretchInstances"
import { useElementTransforms } from "../../hooks/transients"
import { useSubscribeKey } from "../../utils/hooks"
import { round } from "../../utils/math"
import { yAxis } from "../../utils/three"
import { StretchModuleProps } from "./StretchInstanceModule"

type Props = StretchModuleProps & {
  elementName: string
  geometryHash: string
}

const StretchInstanceElement = (props: Props) => {
  const {
    systemId,
    houseId,
    elementName,
    geometryHash,
    levelIndex,
    gridGroupIndex,
    module,
    levelY,
    side,
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

  const { position, rotation } = useHouse(houseId)

  const { startColumn, endColumn } = useStretch(houseId)
  const vanillaColumnLength = useVanillaColumnLength(houseId)

  useEffect(() => {
    if (!meshRef.current) return

    const { x, y, z } = position

    const mirrorFix = module.length / 2
    const houseLength = getHouseLength(houseId)
    const halfHouseLength = getHalfHouseLength(houseId)
    meshRef.current.position.set(
      0,
      levelY,
      mirrorFix -
        halfHouseLength +
        (side === HandleSideEnum.Enum.FRONT
          ? -startColumn.length
          : houseLength - endColumn.length)
    )
    meshRef.current.setRotationFromAxisAngle(yAxis, rotation)
    meshRef.current.position.applyAxisAngle(yAxis, rotation)
    meshRef.current.position.add(new Vector3(x, y, z + halfHouseLength))
  }, [
    endColumn.length,
    houseId,
    levelY,
    module.length,
    position,
    rotation,
    side,
    startColumn.length,
  ])

  // const [scale, setScale] = useState(0)

  useSubscribeKey(stretchProxy, houseId, () => {
    if (!stretchProxy[houseId]) return
    const { distance } = stretchProxy[houseId]
    const z = round(distance / vanillaColumnLength)
    // console.log(z)
    meshRef.current?.scale.setZ(-z)
  })

  useEffect(() => {
    // @ts-ignore
    material.wireframe = true
  }, [material])

  return <mesh ref={meshRef} material={material} geometry={geometry} />
}

export default StretchInstanceElement
