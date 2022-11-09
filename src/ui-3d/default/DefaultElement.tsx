import { useHashedMaterial, useMaterialHash } from "@/hooks/hashedMaterials"
import { useRef } from "react"
import { Mesh } from "three"
import { useHashedGeometry } from "../../hooks/hashedGeometries"
import { setInstance } from "../../hooks/instances"
import { useElementInstancePosition } from "../../hooks/transforms"
import { ModuleProps } from "./DefaultModule"

type Props = ModuleProps & {
  elementName: string
  geometryHash: string
}

const DefaultElement = (props: Props) => {
  const ref = useRef<Mesh>(null)
  const {
    systemId,
    houseId,
    module,
    elementName,
    geometryHash,
    columnIndex,
    levelIndex,
    gridGroupIndex,
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
  // setInstance({
  //   systemId,
  //   houseId,
  //   columnIndex,
  //   levelIndex,
  //   gridGroupIndex,
  //   geometryHash,
  //   materialHash,
  //   columnZ,
  //   levelY,
  //   moduleZ,
  //   elementName,
  // })

  useElementInstancePosition({
    ref,
    systemId,
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    elementName,
  })

  return <mesh ref={ref} material={material} geometry={geometry} />
}

export default DefaultElement
