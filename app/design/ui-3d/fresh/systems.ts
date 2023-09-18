import { liveQuery } from "dexie"
import { flow, pipe } from "fp-ts/lib/function"
import { DoubleSide, MeshStandardMaterial } from "three"
import { Element } from "../../../../server/data/elements"
import { Material } from "../../../../server/data/materials"
import systemsDB, { LastFetchStamped } from "../../../db/systems"
import userDB, { House } from "../../../db/user"
import { O, R, someOrError, T } from "../../../utils/functions"
import { createThreeMaterial, ThreeMaterial } from "../../../utils/three"

// hash(systemId, ifcTag) : airtable element
export let systemElements: Record<string, LastFetchStamped<Element>> = {}

const getSystemElementHash = ({
  systemId,
  ifcTag,
}: {
  systemId: string
  ifcTag: string
}) => [systemId, ifcTag].join(":")

liveQuery(() => systemsDB.elements.toArray()).subscribe((dbElements) => {
  for (let dbElement of dbElements) {
    systemElements[getSystemElementHash(dbElement)] = dbElement
  }
})

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

type EnrichedMaterial = {
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

liveQuery(() => systemsDB.materials.toArray()).subscribe((dbMaterials) => {
  for (let dbMaterial of dbMaterials) {
    systemMaterials[getSystemMaterialHash(dbMaterial)] = {
      material: dbMaterial,
      threeMaterial: createThreeMaterial(dbMaterial),
    }
  }
})

export const getSystemMaterial = ({
  systemId,
  specification,
}: {
  systemId: string
  specification: string
}) => {
  const materialHash = getSystemMaterialHash({ systemId, specification })
  return pipe(
    systemMaterials,
    R.lookup(materialHash),
    someOrError(`no material in ${systemId} for ${specification}`)
  )
}

export const getInitialMaterial = ({
  systemId,
  houseId,
  ifcTag,
}: {
  systemId: string
  houseId: string
  ifcTag: string
}): T.Task<EnrichedMaterial> => {
  const getHouseTask: T.Task<House | undefined> = () =>
    userDB.houses.get(houseId)

  const getDefaultMaterialSpec = () =>
    getSystemElement({ systemId, ifcTag }).defaultMaterial

  return pipe(
    getHouseTask,
    T.map(
      flow(
        O.fromNullable,
        O.map(({ modifiedMaterials }) => {
          if (ifcTag in modifiedMaterials) {
            return modifiedMaterials[ifcTag]
          }
          return getDefaultMaterialSpec()
        }),
        O.getOrElse(getDefaultMaterialSpec),
        (specification) => getSystemMaterial({ systemId, specification })
      )
    )
  )
}
