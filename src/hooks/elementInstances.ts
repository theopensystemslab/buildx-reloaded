import { proxy, ref, useSnapshot } from "valtio"

export type ElementInstanceInput = {
  systemId: string
  houseId: string
  columnIndex: number
  levelIndex: number
  gridGroupIndex: number
  // position: V3
  // scale: V3
  levelY: number
  columnZ: number
  moduleZ: number
  elementName: string
  geometryHash: string
  materialHash: string
}

type ElementInstanceKeyHash = string

export const getElementInstanceKeyHash = ({
  systemId,
  houseId,
  columnIndex,
  levelIndex,
  gridGroupIndex,
  elementName,
}: Omit<
  ElementInstanceInput,
  "columnZ" | "levelY" | "moduleZ" | "geometryHash" | "materialHash"
>) =>
  `${systemId}:${houseId}:${columnIndex},${levelIndex},${gridGroupIndex}:${elementName}`

export type ElementInstanceValue = ElementInstanceInput

type GeometryMaterialHash = string

export const getGeometryMaterialHash = ({
  geometryHash,
  materialHash,
}: {
  geometryHash: string
  materialHash: string
}) => `${geometryHash}::${materialHash}`

export const splitGeometryMaterialHash = (input: string) =>
  input.split("::") as [string, string]

const elements = proxy<
  Record<
    GeometryMaterialHash,
    Record<ElementInstanceKeyHash, ElementInstanceValue>
  >
>({})

export const setInstance = (input: ElementInstanceInput) => {
  const { geometryHash, materialHash } = input

  const geometryMaterialHash = getGeometryMaterialHash({
    geometryHash,
    materialHash,
  })

  const elementInstanceKeyHash = getElementInstanceKeyHash(input)

  const maybeElements = elements?.[geometryMaterialHash]

  if (!maybeElements) {
    // const map = new Map<ElementInstanceKeyHash, ElementInstanceValue>()
    // map.set(elementInstanceKeyHash, input)
    elements[geometryMaterialHash] = {
      [elementInstanceKeyHash]: ref(input),
    }
    return
  } else {
    maybeElements[elementInstanceKeyHash] = ref(input)
  }
}

export const useElementInstancesKeys = () => {
  const snap = useSnapshot(elements)
  return Object.keys(snap)
}

export const useElementInstances = (hash: string) => {
  const snap = useSnapshot(elements[hash]) as typeof elements[""]
  return snap
}

// export const useElementGeometryMaterialHashes = () => {
//   const instances = useSnapshot(elements)
//   return RM.keys(S.Ord)(instances)
// }

// export const useElementInstanceValues = (hash: string) => {
//   const [elementInstanceValues, setElementInstanceValues] = useState<
//     ElementInstanceValue[]
//   >([])

//   useEffect(
//     () =>
//       subscribeMapKey(elements, hash, () => {
//         const foo = elements.get(hash)
//         if (!foo) setElementInstanceValues([])
//         setElementInstanceValues(Array.from(foo?.values() ?? []))
//       }),
//     [hash]
//   )

//   return elementInstanceValues
// }
