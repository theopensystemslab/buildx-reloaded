import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { Instance } from "@react-three/drei"
import { createPortal } from "@react-three/fiber"
import { Fragment, useEffect, useRef, useState } from "react"
import { Mesh, Vector3 } from "three"
import { getHalfHouseLength } from "../../hooks/dimensions"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import { useHouse } from "../../hooks/houses"
import stretchProxy from "../../hooks/stretch"
import { useStretchInstance } from "../../hooks/stretchInstances"
import { useElementTransforms } from "../../hooks/transients"
import { useSubscribeKey } from "../../utils/hooks"
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
    columnZ,
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

  const { position, rotation } = useHouse(houseId)

  useEffect(() => {
    if (!meshRef.current) return

    const { x, y, z } = position

    const mirrorFix = module.length / 2
    const halfHouseLength = getHalfHouseLength(houseId)
    meshRef.current.position.set(
      0,
      levelY,
      columnZ + mirrorFix - halfHouseLength
    )
    meshRef.current.setRotationFromAxisAngle(yAxis, rotation)
    meshRef.current.position.applyAxisAngle(yAxis, rotation)
    meshRef.current.position.add(new Vector3(x, y, z + halfHouseLength))
  }, [columnZ, houseId, levelY, module.length, position, rotation])

  const [scale, setScale] = useState(0)

  useSubscribeKey(stretchProxy, houseId, () => {
    if (!stretchProxy[houseId]) return
    const { distance } = stretchProxy[houseId]
    // console.log([distance, columnZ, scale])

    if (distance < columnZ && scale === 0) setScale(1)
    else if (distance > columnZ && scale === 1) setScale(0)
  })

  return (
    <mesh
      ref={meshRef}
      material={material}
      geometry={geometry}
      scale={[scale, scale, scale]}
    />
  )
}

export default StretchInstanceElement
