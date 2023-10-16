import { liveQuery } from "dexie"
import { flow, identity, pipe } from "fp-ts/lib/function"
import { MeshStandardMaterial } from "three"
import { Element } from "../../../../server/data/elements"
import { Material } from "../../../../server/data/materials"
import systemsDB, {
  LastFetchStamped,
  useAllElements,
  useAllMaterials,
} from "../../../db/systems"
import userDB, { House, useHousesRecord } from "../../../db/user"
import { A, O, R, someOrError, T } from "../../../utils/functions"
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

export class ElementNotFoundError extends Error {
  constructor(public elementName: string, public systemId: string) {
    super(`No element found for ${elementName} in system ${systemId}`)
    this.name = "ElementNotFoundError"
  }
}

export class MaterialNotFoundError extends Error {
  constructor(public elementName: string, public systemId: string) {
    super(`No material found for ${elementName} in system ${systemId}`)
    this.name = "MaterialNotFoundError"
  }
}

export const useGetElementMaterial = () => {
  const elements = useAllElements()
  const materials = useAllMaterials()
  const houses = useHousesRecord()

  return (houseId: string, elementName: string) => {
    const house = houses[houseId]

    const materialName =
      elementName in house.activeElementMaterials
        ? house.activeElementMaterials[elementName]
        : pipe(
            elements,
            A.findFirstMap((el) =>
              el.name === elementName ? O.some(el.defaultMaterial) : O.none
            ),
            O.fold(() => {
              throw new ElementNotFoundError(elementName, house.systemId)
            }, identity)
          )

    return pipe(
      materials,
      A.findFirst((x) => x.specification === materialName),
      O.fold(() => {
        throw new MaterialNotFoundError(elementName, house.systemId)
      }, identity)
    )
  }
}

export const useGetDefaultElementMaterial = () => {
  const elements = useAllElements()
  const materials = useAllMaterials()

  return ({ systemId, ifcTag }: { systemId: string; ifcTag: string }) =>
    pipe(
      elements,
      A.findFirstMap((el) => {
        return el.systemId === systemId && el.ifcTag.toUpperCase() === ifcTag
          ? O.some(el.defaultMaterial)
          : O.none
      }),
      O.chain((materialName) =>
        pipe(
          materials,
          A.findFirstMap((x) =>
            x.systemId === systemId && x.specification === materialName
              ? O.some({ ...x, threeMaterial: createThreeMaterial(x) })
              : O.none
          )
        )
      )
    )
}
