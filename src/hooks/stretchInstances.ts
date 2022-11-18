import { RefObject, useEffect } from "react"
import { Object3D } from "three"
import { proxy, useSnapshot } from "valtio"
import { useUnmountEffect } from "../utils/hooks"

type StretchElementInstanceKeyHash = string

export type StretchElementInstanceInput = {
  systemId: string
  houseId: string
  // dna: string
  columnZ: number
  levelY: number
  geometryHash: string
  materialHash: string
  // z: number
  // y: number
}

type StretchElementInstanceValue = StretchElementInstanceInput

type GeometryMaterialHash = string

const stretchInstances = proxy<
  Record<
    GeometryMaterialHash,
    Array<{ y: number; z: number }>
    // Record<StretchElementInstanceKeyHash, StretchElementInstanceValue>
  >
>({})

const getGeometryMaterialHash = ({
  geometryHash,
  materialHash,
}: {
  geometryHash: string
  materialHash: string
}) => `${geometryHash}::${materialHash}`

export const useStretchInstance = ({
  geometryHash,
  materialHash,
  levelY,
  columnZ,
}: StretchElementInstanceInput) => {
  const geometryMaterialHash = getGeometryMaterialHash({
    geometryHash,
    materialHash,
  })

  const setInstance = () => {
    if (!(geometryMaterialHash in stretchInstances)) {
      stretchInstances[geometryMaterialHash] = [{ y: levelY, z: columnZ }]
    }
    // else if (stretchInstances[geometryMaterialHash].includes) {
    // }
  }

  useUnmountEffect(() => void delete stretchInstances[geometryMaterialHash])
  return null
}

// export const useStretchElementInstanceParent = (
//   geometryHash: string,
//   materialHash: string
// ) => {
//   const snap = useSnapshot(stretchInstances)
//   const hash = getGeometryMaterialHash({ geometryHash, materialHash })
//   if (hash in snap) {
//     return snap[hash]
//   } else {
//     stretchInstances[hash] = null
//   }
// }

export default stretchInstances
