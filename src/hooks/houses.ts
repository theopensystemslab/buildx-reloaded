import { ThreeEvent } from "@react-three/fiber"
import { Handler } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { none, some } from "fp-ts/lib/Option"
import * as RA from "fp-ts/ReadonlyArray"
import produce from "immer"
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react"
import { Group } from "three"
import { proxy, subscribe, useSnapshot } from "valtio"
import { subscribeKey } from "valtio/utils"
import { BUILDX_LOCAL_STORAGE_HOUSES_KEY } from "../constants"
import { getHousesFromLocalStorage, Houses } from "../data/house"
import { useAllHouseTypes } from "../data/houseType"
import { Module } from "../data/module"
import { setCameraEnabled } from "./camera"
import globals from "./globals"
import { useSystemModules } from "./modules"

const houses = proxy<Houses>(getHousesFromLocalStorage())

export const useLocallyStoredHouses = () =>
  useEffect(
    () =>
      subscribe(houses, () => {
        localStorage.setItem(
          BUILDX_LOCAL_STORAGE_HOUSES_KEY,
          JSON.stringify(houses)
        )
      }),
    []
  )

export const useHouses = () => {
  useLocallyStoredHouses()
  return useSnapshot(houses)
}

export const useHouse = (houseId: string) => {
  const housesSnap = useSnapshot(houses)
  return housesSnap[houseId]
}

export const useHouseType = (houseId: string) => {
  const house = useHouse(houseId)
  const { data } = useAllHouseTypes()
  const houseTypes = data ?? []
  const houseType = houseTypes.find((ht) => ht.id === house.houseTypeId)
  if (!houseType) throw new Error("houseType not found")
  return houseType
}

export const useHouseModules = (houseId: string) => {
  const { systemId } = useHouse(houseId)
  const systemModules = useSystemModules({ systemId })

  const house = useSnapshot(houses)[houseId]

  return useMemo(
    () =>
      pipe(
        house.dna,
        RA.filterMap((dna) =>
          pipe(
            systemModules,
            RA.findFirst(
              (systemModule: Module) =>
                systemModule.systemId === house.systemId &&
                systemModule.dna === dna
            )
          )
        )
      ),
    [house.dna, house.systemId, systemModules]
  )
}

export const modulesToRows = (
  modules: readonly Module[]
): readonly Module[][] => {
  const jumpIndices = pipe(
    modules,
    RA.filterMapWithIndex((i, m) =>
      m.structuredDna.positionType === "END" ? some(i) : none
    ),
    RA.filterWithIndex((i) => i % 2 === 0)
  )

  return pipe(
    modules,
    RA.reduceWithIndex(
      [],
      (moduleIndex, modules: Module[][], module: Module) => {
        return jumpIndices.includes(moduleIndex)
          ? [...modules, [{ ...module, moduleIndex }]]
          : produce(
              (draft) =>
                void draft[draft.length - 1].push({ ...module, moduleIndex })
            )(modules)
      }
    )
  )
}
export const useHouseRows = (buildingId: string) => {
  const houseModules = useHouseModules(buildingId)
  return modulesToRows(houseModules)
}

export const useMoveHouse = (
  houseId: string,
  groupRef: MutableRefObject<Group | null>
) => {
  const onPositionUpdate = useCallback(() => {
    if (!groupRef.current) return
    const [x, _, z] = houses[houseId].position
    groupRef.current.position.set(x, 0, z)
  }, [groupRef, houseId])

  useEffect(() => {
    onPositionUpdate()
    return subscribe(houses[houseId].position, onPositionUpdate)
  }, [houseId, onPositionUpdate])

  const onRotationUpdate = useCallback(() => {
    if (!groupRef.current) return
    groupRef.current.rotation.set(0, houses[houseId].rotation, 0)
  }, [groupRef, houseId])

  useEffect(() => {
    onRotationUpdate()
    return subscribeKey(houses[houseId], "rotation", onRotationUpdate)
  }, [houseId, onRotationUpdate])

  // const contextMode = useSiteContextMode()
  // const { editMode } = useSiteContext()

  const lastPointer = useRef<[number, number]>([0, 0])

  const houseDragHandler: Handler<"drag", ThreeEvent<PointerEvent>> = ({
    first,
    last,
  }) => {
    // if (
    //   contextMode !== SiteContextModeEnum.Enum.SITE ||
    //   editMode !== EditModeEnum.Enum.MOVE_ROTATE
    // ) {
    //   return
    // }

    // if (scope.selected?.buildingId !== houseId) return

    if (first) {
      setCameraEnabled(false)
      lastPointer.current = globals.pointerXZ
    }

    const [px0, pz0] = lastPointer.current
    const [px1, pz1] = globals.pointerXZ

    const [dx, dz] = [px1 - px0, pz1 - pz0]

    houses[houseId].position[0] += dx
    houses[houseId].position[2] += dz

    // invalidate()
    const snapToGrid = (x: number) => {
      return Math.round(x)
    }

    if (last) {
      setCameraEnabled(true)
      const [x, , z] = houses[houseId].position.map(snapToGrid)
      houses[houseId].position[0] = x
      houses[houseId].position[2] = z
    }

    lastPointer.current = globals.pointerXZ
  }

  return { houseDragHandler }
}

export default houses
