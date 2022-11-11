import { ThreeEvent } from "@react-three/fiber"
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
import { Group, Mesh } from "three"
import { proxy, subscribe, useSnapshot } from "valtio"
import { subscribeKey } from "valtio/utils"
import { BUILDX_LOCAL_STORAGE_HOUSES_KEY } from "../constants"
import { getHousesFromLocalStorage, House, Houses } from "../data/house"
import { useAllHouseTypes } from "../data/houseType"
import { Module, useSystemModules } from "../data/modules"
import { A, pipeLog, R, RA, RNEA, RR, S } from "../utils/functions"
import { setCameraEnabled } from "./camera"
import events from "./old-events"
import globals from "./globals"
import { nanoid } from "nanoid"
import { useKey } from "react-use"
import { keys } from "fp-ts/lib/ReadonlyRecord"
import { ElementIdentifier } from "../data/elements"

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
  const { systemId, dna } = useHouse(houseId)
  const systemModules = useSystemModules({ systemId })

  return useMemo(
    () =>
      pipe(
        dna,
        RA.filterMap((dna) =>
          pipe(
            systemModules,
            RA.findFirst(
              (systemModule: Module) =>
                systemModule.systemId === systemId && systemModule.dna === dna
            )
          )
        )
      ),
    [dna, systemId, systemModules]
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

export const useNewHouseEventsHandlers = () => {
  const lastPointer = useRef<[number, number]>([0, 0])

  return useGesture<{ drag: ThreeEvent<PointerEvent> }>({
    onDrag: ({
      first,
      last,
      event: {
        object: { userData: elementIdentifier },
      },
    }) => {
      const {
        systemId,
        houseId,
        columnIndex,
        levelIndex,
        gridGroupIndex,
        elementName,
      } = elementIdentifier as ElementIdentifier

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

export const useHouseEventHandlers = (houseId: string): any => {
  // const contextMode = useSiteContextMode()
  // const { editMode } = useSiteContext()

  const lastPointer = useRef<[number, number]>([0, 0])

  return useGesture({
    onDrag: ({ first, last, event }) => {
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
  ref: MutableRefObject<Group | Mesh | null>
) => {
  const onPositionUpdate = useCallback(() => {
    if (!ref.current) return
    const [x, y, z] = houses[houseId].position
    ref.current.position.set(x, y, z)
  }, [ref, houseId])

  useEffect(() => {
    onPositionUpdate()
    return subscribeKey(houses[houseId], "position", onPositionUpdate)
  }, [houseId, onPositionUpdate])

  const onRotationUpdate = useCallback(() => {
    if (!ref.current) return
    ref.current.rotation.set(0, houses[houseId].rotation, 0)
  }, [ref, houseId])

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

export const useInsert1000Skylarks = () => {
  const { data: allHouseTypes } = useAllHouseTypes()

  useKey(
    "x",
    () => {
      // const position = cameraGroundRaycast() ?? [0, 0, 0]
      const houseTypeId = "recSARkreiK3KMoTi"

      const houseType = allHouseTypes?.find((x) => x.id === houseTypeId)
      if (!houseType) throw new Error("skylark not found")

      const count = 11,
        incX = 7,
        incZ = 3,
        startX = -(incX * count) / 2,
        startZ = -(incZ * count) / 2

      for (let x = startX; x < incX * count; x += incX) {
        for (let z = startZ; z < incZ * count; z += incZ) {
          const id = nanoid()
          houses[id] = {
            id,
            houseTypeId,
            systemId: houseType.systemId,
            position: [x, 0, z],
            rotation: 0,
            dna: houseType.dna as string[],
            modifiedMaterials: {},
            modifiedMaterialsPreview: {},
            friendlyName: `Building ${keys(houses).length + 1}`,
          }
        }
      }
    },
    undefined,
    [allHouseTypes]
  )
}

export const systemDnaElementMaterials = proxy<string[]>([])

export const useSystemDnaElementMaterials = () => {
  // use default material from elementName
  useEffect(() => {
    return subscribe(houses, () => {
      const systemDnas = pipe(
        houses,
        RR.collect(S.Ord)((k, a) => a),
        RNEA.groupBy(({ systemId }) => systemId),
        RR.map(
          (houses) =>
            pipe(
              houses,
              RA.reduce([], (acc: string[], { dna }) => [...acc, ...dna]),
              RA.uniq(S.Eq)
            )
          // ...house.reduce((acc: string[], v) => [...acc, ...v.dna], []),
        )
        // RR.map((houses) =>
        //   pipe(
        //     houses,
        //     RA.reduce({}, (acc,house) => produce(acc, draft => {
        //       house.dna.forEach(strand => {
        //         draft[strand].
        //       })
        //     }))
        //   )
        // )
        // RA.uniq(S.Eq)
      )

      // group by systemId

      const uniqueDnas = pipe(
        // this needs to be foreach'd by system
        houses,
        RR.collect(S.Ord)((_, { dna }) => dna),
        RA.flatten,
        RA.uniq(S.Eq)
      )

      // unique systems
      // unique modules

      // modified materials
    })
  }, [])
}

export default houses
