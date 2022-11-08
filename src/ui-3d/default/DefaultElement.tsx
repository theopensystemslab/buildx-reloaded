import { hashedGeometries } from "@/hooks/hashedGeometries"
import { useMaterial } from "@/hooks/hashedMaterials"
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
    columnZ,
    levelY,
    moduleZ,
    mirror,
  } = props

  const z = columnZ + moduleZ

  const material = useMaterial({
    systemId,
    houseId,
    elementName,
    visible: true,
    clippingPlanes: [],
  })

  const geometry = hashedGeometries.get(geometryHash)

  const position: V3 = [
    0,
    levelY,
    mirror ? z + module.length / 2 : z - module.length / 2,
  ]

  const scale: V3 = [1, 1, mirror ? 1 : -1]

  return (
    <mesh
      {...{
        position,
        scale,
        geometry,
        material,
      }}
    />
  )
}

export default DefaultElement
