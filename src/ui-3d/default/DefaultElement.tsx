import { hashedGeometries } from "@/hooks/hashedGeometries"
import { useMaterialHash } from "@/hooks/hashedMaterials"
import { setInstance } from "../../hooks/instances"
import { ModuleProps } from "./DefaultModule"

type Props = ModuleProps & {
  elementName: string
  geometryHash: string
}

const DefaultElement = (props: Props) => {
  const {
    systemId,
    houseId,
    module,
    elementName,
    geometryHash,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    columnZ,
    levelY,
    moduleZ,
    mirror,
  } = props

  const z = columnZ + moduleZ

  const materialHash = useMaterialHash({
    systemId,
    houseId,
    elementName,
    visible: true,
    clippingPlanes: [],
  })

  const position: V3 = [
    0,
    levelY,
    mirror ? z + module.length / 2 : z - module.length / 2,
  ]

  const scale: V3 = [1, 1, mirror ? 1 : -1]

  setInstance({
    systemId,
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    geometryHash,
    materialHash,
    position,
    scale,
    elementName,
  })

  return null
}

export default DefaultElement
