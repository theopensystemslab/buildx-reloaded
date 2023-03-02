import { values } from "fp-ts-std/Record"
import { pipe } from "fp-ts/lib/function"
import { none, some } from "fp-ts/lib/Option"
import { keys } from "fp-ts/lib/ReadonlyRecord"
import produce from "immer"
import { nanoid } from "nanoid"
import { useEffect, useMemo } from "react"
import { useKey } from "react-use"
import { Vector3 } from "three"
import { proxy, subscribe, useSnapshot } from "valtio"
import { BUILDX_LOCAL_STORAGE_HOUSES_KEY } from "../constants"
import { getHousesFromLocalStorage, House, Houses } from "../data/house"
import { useAllHouseTypes } from "../data/houseType"
import { Module, useSystemModules } from "../data/modules"
import { A, R, RA, RNEA, RR, S } from "../utils/functions"

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
  return useSnapshot(houses) as typeof houses
}

export const useHouseKeys = () => {
  useLocallyStoredHouses()
  return pipe(useSnapshot(houses) as typeof houses, RR.keys)
}

export const useHouse = (houseId: string) => {
  const housesSnap = useSnapshot(houses) as typeof houses
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
        A.filterMap((dna) =>
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

export const useDnaModules = (systemId: string, dna: string[]) => {
  const systemModules = useSystemModules({ systemId })

  return useMemo(
    () =>
      pipe(
        dna,
        A.filterMap((dna) =>
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
            position: new Vector3(x, 0, z),
            rotation: 0,
            dna: houseType.dna as string[],
            modifiedMaterials: {},
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

export const useHouseSystemId = (houseId: string) => {
  const houses = useHouses()
  const { systemId } = houses[houseId]
  return systemId
}

export default houses
