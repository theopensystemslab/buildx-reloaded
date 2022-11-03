import { useGesture } from "@use-gesture/react"
import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import { none, some } from "fp-ts/lib/Option"
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
import { getHousesFromLocalStorage, House, Houses } from "../data/house"
import { useAllHouseTypes } from "../data/houseType"
import { Module, useSystemModules } from "../data/modules"
import { A, R, RA, RR, S } from "../utils/functions"
import { setCameraEnabled } from "./camera"
import events from "./events"
import globals from "./globals"

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

export const useHouseEventHandlers = (houseId: string): any => {
  // const contextMode = useSiteContextMode()
  // const { editMode } = useSiteContext()

  const lastPointer = useRef<[number, number]>([0, 0])

  return useGesture({
    onDrag: ({ first, last }) => {
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

      events.before.newHouseTransform = {
        houseId,
        positionDelta: [dx, 0, dz],
        rotation: 0,
      }

      // invalidate()
      const snapToGrid = (x: number) => {
        return Math.round(x)
      }

      if (last) {
        setCameraEnabled(true)
        // const [x, , z] = houses[houseId].position.map(snapToGrid)
        // houses[houseId].position[0] = x
        // houses[houseId].position[2] = z
      }

      lastPointer.current = globals.pointerXZ
    },
  })
}

export const useMoveRotateSubscription = (
  houseId: string,
  groupRef: MutableRefObject<Group | null>
) => {
  const onPositionUpdate = useCallback(() => {
    if (!groupRef.current) return
    const [x, y, z] = houses[houseId].position
    groupRef.current.position.set(x, y, z)
  }, [groupRef, houseId])

  useEffect(() => {
    onPositionUpdate()
    return subscribeKey(houses[houseId], "position", onPositionUpdate)
  }, [houseId, onPositionUpdate])

  const onRotationUpdate = useCallback(() => {
    if (!groupRef.current) return
    groupRef.current.rotation.set(0, houses[houseId].rotation, 0)
  }, [groupRef, houseId])

  useEffect(() => {
    onRotationUpdate()
    return subscribeKey(houses[houseId], "rotation", onRotationUpdate)
  }, [houseId, onRotationUpdate])
}

export const useHousesSystems = () => {
  const snap = useSnapshot(houses) as typeof houses
  return pipe(
    snap,
    RR.reduce(S.Ord)([], (acc: string[], { systemId }) => {
      return A.uniq(S.Eq)([...acc, systemId])
    })
  )
}

export const useSystemHouses = (systemId: string): House[] => {
  const snap = useSnapshot(houses) as typeof houses

  return pipe(
    snap,
    R.filter((v) => v.systemId === systemId),
    values
  )
}

export const useSystemUniqueDnas = (systemId: string): string[] => {
  const systemHouses = useSystemHouses(systemId)
  return pipe(
    systemHouses,
    A.reduce([], (acc: string[], { dna }) => A.uniq(S.Eq)([...acc, ...dna]))
  )
}

export default houses
