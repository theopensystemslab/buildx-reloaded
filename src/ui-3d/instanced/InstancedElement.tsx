import { useMaterialHash } from "@/hooks/hashedMaterials"
import { setInstance } from "../../hooks/elementInstances"
import { ModuleProps } from "./InstancedModule"

type Props = ModuleProps & {
  elementName: string
  geometryHash: string
}

const InstancedElement = (props: Props) => {
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

  const materialHash = useMaterialHash({
    systemId,
    houseId,
    elementName,
    visible: true,
    clippingPlanes: [],
  })

  setInstance({
    systemId,
    houseId,
    columnIndex,
    levelIndex,
    gridGroupIndex,
    geometryHash,
    materialHash,
    columnZ,
    levelY,
    moduleZ,
    elementName,
  })

  return null
}

export default InstancedElement
