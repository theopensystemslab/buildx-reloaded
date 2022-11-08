import { pipe } from "fp-ts/lib/function"
import { useMemo } from "react"
import { Material, Plane } from "three"
import { proxyMap } from "valtio/utils"
import { useSystemElements } from "../data/elements"
import { useSystemMaterials } from "../data/materials"
import { O, RA, someOrError } from "../utils/functions"
import { createMaterial } from "../utils/three"
import { useHouse } from "./houses"

type MaterialKey = {
  color: string
  visible: boolean
  clippingPlanes: Plane[]
}

type HashedMaterialKey = string

const getMaterialHash = ({ color, visible, clippingPlanes }: MaterialKey) =>
  `color:${color};visible:${visible};clipPlanes:${clippingPlanes}`

const hashedMaterials = proxyMap<HashedMaterialKey, Material>()
// hash is system:house:element:material:clippingPlanes:visible

export const useMaterialName = (houseId: string, elementName: string) => {
  const { modifiedMaterials, modifiedMaterialsPreview, systemId } =
    useHouse(houseId)
  const elements = useSystemElements({ systemId })

  const defaultMaterialName = pipe(
    elements,
    RA.findFirstMap(({ name, defaultMaterial }) =>
      name === elementName ? O.some(defaultMaterial) : O.none
    ),
    someOrError("no element")
  )

  return useMemo(() => {
    if (elementName in modifiedMaterialsPreview)
      return modifiedMaterialsPreview[elementName]
    else if (elementName in modifiedMaterials)
      return modifiedMaterials[elementName]
    else return defaultMaterialName
  }, [
    defaultMaterialName,
    elementName,
    modifiedMaterials,
    modifiedMaterialsPreview,
  ])
}

export const useMaterial = (input: {
  systemId: string
  houseId: string
  elementName: string
  visible: boolean
  clippingPlanes: Plane[]
}) => {
  const { systemId, houseId, elementName, clippingPlanes, visible } = input
  const materials = useSystemMaterials({ systemId })
  const materialName = useMaterialName(houseId, elementName)
  const material = pipe(
    materials,
    RA.findFirst((m) => m.name === materialName),
    someOrError("no material")
  )

  return useMemo(() => {
    const materialHash = getMaterialHash({
      color: material.defaultColor,
      clippingPlanes,
      visible,
    })
    const maybeMaterial = hashedMaterials.get(materialHash)
    if (maybeMaterial) return maybeMaterial

    const newMaterial = createMaterial(material)
    hashedMaterials.set(materialHash, newMaterial)

    return newMaterial
  }, [clippingPlanes, material, visible])
}

export default hashedMaterials
