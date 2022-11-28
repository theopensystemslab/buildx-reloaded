import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { Instance } from "@react-three/drei"
import { createPortal } from "@react-three/fiber"
import { Fragment, useRef } from "react"
import { Mesh } from "three"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import { useStretchInstance } from "../../hooks/stretchInstances"
import { useElementTransforms } from "../../hooks/transients"
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
    levelY,
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

  return (
    <mesh
      // ref={meshRef}
      position={[0, levelY, columnZ]}
      material={material}
      geometry={geometry}
      // userData={{
      //   elementIdentifier,
      // }}
    />
  )
}

export default StretchInstanceElement
