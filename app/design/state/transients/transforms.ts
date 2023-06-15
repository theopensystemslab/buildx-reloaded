import { invalidate } from "@react-three/fiber"
import { MutableRefObject, useRef } from "react"
import { Group, Vector3 } from "three"
import { useDebouncedCallback } from "use-debounce"
import { proxy } from "valtio"
import { useSubscribeKey } from "~/utils/hooks"
import { yAxis } from "~/utils/three"
import dimensions, { collideOBB, useComputeDimensions } from "../dimensions"
import { dispatchUpdateExportModelsEvent } from "../exporters"
import houses from "../houses"

export type Transforms = {
  position?: DeltaV3
  rotation?: number
}

export type TransformsTransients = Record<string, Transforms>

export const preTransformsTransients = proxy<TransformsTransients>({})

export const usePreTransformsTransients = (houseId: string) => {
  const computeDimensions = useComputeDimensions(houseId)

  useSubscribeKey(
    preTransformsTransients,
    houseId,
    () => {
      const { obb } = computeDimensions(preTransformsTransients[houseId])
      const collision = collideOBB(obb, [houseId])

      if (collision) return

      postTransformsTransients[houseId] = preTransformsTransients[houseId]
    },
    false
  )
}

export const postTransformsTransients = proxy<TransformsTransients>({})

export const setTransforms = () => {
  for (let houseId of Object.keys(postTransformsTransients)) {
    const { position, rotation } = postTransformsTransients[houseId] ?? {}
    if (position) {
      const { x, y, z } = houses[houseId].position
      const { dx, dy, dz } = position
      houses[houseId].position = {
        x: x + dx,
        y: y + dy,
        z: z + dz,
      }
    }
    if (rotation) {
      houses[houseId].rotation += rotation
    }
    delete postTransformsTransients[houseId]
    delete preTransformsTransients[houseId]
  }
}

export const usePostTransformsTransients = (
  houseId: string,
  houseGroupRef: MutableRefObject<Group>
) => {
  const tPosV = useRef(new Vector3())

  const debouncedExportUpdater = useDebouncedCallback(
    () => {
      const houseJson = houseGroupRef.current.toJSON()

      dispatchUpdateExportModelsEvent({
        houseId,
        payload: houseJson,
      })
    },
    2000,
    { leading: false, trailing: true }
  )

  useSubscribeKey(
    postTransformsTransients,
    houseId,
    () => {
      const house = houses[houseId]
      if (!house) return

      const houseLength = dimensions[houseId].length

      const { position, rotation } = postTransformsTransients[houseId] ?? {}

      const r = house.rotation + (rotation ?? 0)
      const hx = house.position.x + (position?.dx ?? 0)
      const hy = house.position.y + (position?.dy ?? 0)
      const hz = house.position.z + (position?.dz ?? 0)

      houseGroupRef.current.position.set(0, 0, -houseLength / 2)

      houseGroupRef.current.setRotationFromAxisAngle(yAxis, r)
      houseGroupRef.current.position.applyAxisAngle(yAxis, r)

      tPosV.current.set(hx, hy, hz)
      houseGroupRef.current.position.add(tPosV.current)

      invalidate()

      debouncedExportUpdater()
    },
    true
  )
}
