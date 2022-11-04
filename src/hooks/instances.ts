import { fromEquals } from "fp-ts/lib/Eq"
import { pipe } from "fp-ts/lib/function"
import { useSnapshot } from "valtio"
import { proxyMap } from "valtio/utils"
import { useGetMaterial } from "../data/materials"
import { O, RA } from "../utils/functions"
import { ColumnLayoutKeyInput } from "./layouts"

// module level
// system+dna+elementName :: InstanceT

type SystemIdDnaElementName = string

type InstanceData = ColumnLayoutKeyInput & {
  position: V3
  rotation: number
  dna: string
  elementName: string
}

const instances = proxyMap<SystemIdDnaElementName, InstanceData[]>()

export const useInstances = () => useSnapshot(instances) as typeof instances

const getInstancesKey = ({
  systemId,
  dna,
  elementName,
}: {
  systemId: string
  dna: string
  elementName: string
}) => `system:${systemId}-dna:${dna}-elementName:${elementName}`

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
