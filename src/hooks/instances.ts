import { fromEquals } from "fp-ts/lib/Eq"
import { pipe } from "fp-ts/lib/function"
import { BufferGeometry, Material } from "three"
import { useSnapshot } from "valtio"
import { proxyMap } from "valtio/utils"
import { useGetMaterial } from "../data/materials"
import { O, RA } from "../utils/functions"
import { ColumnLayoutKeyInput } from "./layouts"
import * as z from "zod"

// module level
// system+dna+elementName :: InstanceT

type SystemIdDnaElementNameString = string

type InstanceData = ColumnLayoutKeyInput & {
  position: V3
  rotation: number
  dna: string
  elementName: string
}

// type InstancesData = {
//   geometry: BufferGeometry
//   material: Material
//   instances: InstanceData[]
// }

const instances = proxyMap<SystemIdDnaElementNameString, InstanceData[]>()

export const useInstances = () => useSnapshot(instances) as typeof instances

export const getInstancesKey = ({
  systemId,
  dna,
  elementName,
}: {
  systemId: string
  dna: string
  elementName: string
}) => `system:${systemId}-dna:${dna}-elementName:${elementName}`

export const invertInstancesKey = (input: string) =>
  pipe(
    JSON.parse(input),
    z.object({
      systemId: z.string().min(1),
      dna: z.string().min(1),
      elementName: z.string().min(1),
    }).parse
  )

export type InstancesKey = ReturnType<typeof invertInstancesKey>

const instanceDataEq = fromEquals<InstanceData>(
  (a, b) =>
    a.systemId === b.systemId &&
    a.houseId === b.houseId &&
    a.dna === b.dna &&
    a.elementName === b.elementName &&
    a.columnIndex === b.columnIndex &&
    a.levelIndex === b.levelIndex &&
    a.gridGroupIndex === b.gridGroupIndex
)

export const useUpsertInstance = (houseId: string) => {
  useGetMaterial(houseId)

  return (instance: InstanceData): void => {
    const { systemId, houseId, dna, elementName } = instance
    const key = getInstancesKey({ systemId, dna, elementName })
    const maybeParent = instances.get(key)

    if (maybeParent) {
      // const instanceExists = maybeParent.find(x => x.)
      pipe(
        maybeParent,
        RA.findFirst((x) => instanceDataEq.equals(x, instance)),
        O.match(
          () => void maybeParent.push(instance),
          (x: InstanceData) => {}
        )
      )
      return
    } else {
      instances.set(key, [instance])
    }
  }
}

export default instances
