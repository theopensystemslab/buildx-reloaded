import { liveQuery } from "dexie"
import { identity, pipe } from "fp-ts/lib/function"
import { DoubleSide, MeshStandardMaterial } from "three"
import { Element } from "../../../../server/data/elements"
import { Material } from "../../../../server/data/materials"
import systemsDB, { LastFetchStamped } from "../../../db/systems"
import { O, R } from "../../../utils/functions"
import { createMaterial } from "../../../utils/three"

export let elements: Record<string, LastFetchStamped<Element>> = {}

liveQuery(() => systemsDB.elements.toArray()).subscribe((dbElements) => {
  for (let dbElement of dbElements) {
    elements[dbElement.ifc4Variable] = dbElement
  }
})

// specification : airtable material
export let materials: Record<string, LastFetchStamped<Material>> = {}

liveQuery(() => systemsDB.materials.toArray()).subscribe((dbMaterials) => {
  for (let dbMaterial of dbMaterials) {
    materials[dbMaterial.specification] = dbMaterial
  }
})

const basicMaterial = new MeshStandardMaterial({
  color: "tomato",
  side: DoubleSide,
})

// hash(systemId, houseId, material specification) : ThreeMaterial
const threeMaterials: Record<string, MeshStandardMaterial> = {}

const getMaterialHash = ({
  systemId,
  houseId,
  specification,
}: {
  systemId: string
  houseId: string
  specification: string
}) => `${systemId}:${houseId}:${specification}`

const getThreeMaterial = ({
  systemId,
  houseId,
  material,
  material: { specification },
}: {
  systemId: string
  houseId: string
  material: Material
}): MeshStandardMaterial => {
  const materialHash = getMaterialHash({ systemId, houseId, specification })
  return pipe(
    threeMaterials,
    R.lookup(materialHash),
    O.match(() => {
      threeMaterials[materialHash] = createMaterial(material)
      return threeMaterials[materialHash]
    }, identity)
  )
}

export const getMaterial = (
  input: {
    systemId: string
    houseId: string
    ifcTag: string
  } | null = null
): MeshStandardMaterial => {
  if (input === null) return basicMaterial

  const { systemId, houseId, ifcTag } = input

  return pipe(
    elements,
    R.lookup(ifcTag),
    O.chain(({ defaultMaterial }) =>
      pipe(
        materials,
        R.lookup(defaultMaterial),
        O.map((material) => getThreeMaterial({ systemId, houseId, material }))
      )
    ),
    O.getOrElse(() => basicMaterial)
  )
}
