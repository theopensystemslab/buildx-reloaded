import { liveQuery } from "dexie"
import { flow, pipe } from "fp-ts/lib/function"
import { MeshStandardMaterial } from "three"
import { Element } from "../../../../server/data/elements"
import { Material } from "../../../../server/data/materials"
import systemsDB, { LastFetchStamped } from "../../../db/systems"
import userDB, { House } from "../../../db/user"
import { O, R, someOrError, T } from "../../../utils/functions"
import { createThreeMaterial } from "../../../utils/three"

// SYSTEM ELEMENTS

// hash(systemId, ifcTag) : airtable element
export let systemElements: Record<string, LastFetchStamped<Element>> = {}

const getSystemElementHash = ({
  systemId,
  ifcTag,
}: {
  systemId: string
  ifcTag: string
}) => [systemId, ifcTag].join(":")

export const getSystemElement = ({
  systemId,
  ifcTag,
}: {
  systemId: string
  ifcTag: string
}) =>
  pipe(
    systemElements,
    R.lookup(getSystemElementHash({ systemId, ifcTag })),
    someOrError(`no element in ${systemId} for ${ifcTag}`)
  )

// SYSTEM MATERIALS

export type EnrichedMaterial = {
  material: LastFetchStamped<Material>
  threeMaterial: MeshStandardMaterial
}

// hash(systemId, material specification) : airtable material
export let systemMaterials: Record<string, EnrichedMaterial> = {}

const getSystemMaterialHash = ({
  systemId,
  specification,
}: {
  systemId: string
  specification: string
}) => [systemId, specification].join(":")

export const getSystemMaterial = ({
  systemId,
  specification,
}: {
  systemId: string
  specification: string
}): EnrichedMaterial => {
  const materialHash = getSystemMaterialHash({ systemId, specification })

  return pipe(
    systemMaterials,
    R.lookup(materialHash),
    someOrError(`no material in ${systemId} for ${specification}`)
  )
}

// LIVE QUERIES

liveQuery(() => systemsDB.elements.toArray()).subscribe((dbElements) => {
  for (let dbElement of dbElements) {
    systemElements[getSystemElementHash(dbElement)] = dbElement
  }
})

liveQuery(() => systemsDB.materials.toArray()).subscribe((dbMaterials) => {
  for (let dbMaterial of dbMaterials) {
    systemMaterials[getSystemMaterialHash(dbMaterial)] = {
      material: dbMaterial,
      threeMaterial: createThreeMaterial(dbMaterial),
    }
  }
})
