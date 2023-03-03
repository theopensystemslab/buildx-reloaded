import {
  filterCompatibleModules,
  Module,
  topCandidateByHamming,
  useSystemModules,
} from "@/data/modules"
import { SectionType, useSystemSectionTypes } from "@/data/sectionTypes"
import dimensions, { useHouseDimensionsUpdates } from "@/hooks/dimensions"
import {
  ColumnLayout,
  columnLayoutToDNA,
  GridGroup,
  PositionedColumn,
  PositionedModule,
} from "@/hooks/layouts"
import { useGetVanillaModule } from "@/hooks/vanilla"
import {
  A,
  mapToOption,
  NEA,
  Num,
  O,
  Ord,
  reduceToOption,
} from "@/utils/functions"
import { useSubscribeKey } from "@/utils/hooks"
import { max, min, sign } from "@/utils/math"
import { GroupProps, invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray"
import { Ordering } from "fp-ts/lib/Ordering"
import { forwardRef, useEffect, useRef } from "react"
import { Group } from "three"
import { proxy, ref } from "valtio"
import { useHouse } from "../../../hooks/houses"
import previews from "../../../hooks/previews"
import { useIsStretchable } from "../../../hooks/siteCtx"
import StretchHandle from "../../handles/StretchHandle"

export type StretchWidthRaw = {
  direction: 1 | -1
  dx: number
  dz: number
  distance: number
}

export type StretchWidthClamped = Omit<StretchWidthRaw, "direction">

export const stretchWidthRaw = proxy<Record<string, StretchWidthRaw>>({})
export const stretchWidthClamped = proxy<Record<string, StretchWidthClamped>>(
  {}
)

type Props = GroupProps & {
  houseId: string
  setHouseVisible: (b: boolean) => void
  columnLayout: ColumnLayout
}

const StretchWidth = forwardRef<Group, Props>((props, rootRef) => {
  const { houseId, columnLayout, setHouseVisible, ...groupProps } = props

  const rightHandleRef = useRef<Group>(null!)
  const leftHandleRef = useRef<Group>(null!)

  const isStretchable = useIsStretchable(houseId)

  const systemId = "skylark"

  const systemModules = useSystemModules({ systemId })
  const sectionTypes = useSystemSectionTypes({ systemId })

  const getVanillaModule = useGetVanillaModule(systemId)

  const module0 = columnLayout[0].gridGroups[0].modules[0].module

  const { width: houseWidth } = useHouseDimensionsUpdates(houseId)

  type AugSectionType = SectionType & {
    // live: boolean
    houseDna: string[]
    houseDnaKey: string
    dx: number
  }

  const augSectionTypes: NonEmptyArray<AugSectionType> = pipe(
    sectionTypes,
    A.filterMap((st) =>
      pipe(
        columnLayout,
        mapToOption(
          ({ gridGroups, ...columnRest }): O.Option<PositionedColumn> =>
            pipe(
              gridGroups,
              mapToOption(
                ({ modules, ...gridGroupRest }): O.Option<GridGroup> => {
                  try {
                    const vanillaModule = getVanillaModule(modules[0].module, {
                      sectionType: st.code,
                    })

                    return pipe(
                      modules,
                      reduceToOption(
                        O.some([]),
                        (
                          _i,
                          acc: O.Option<PositionedModule[]>,
                          { module, z }: PositionedModule
                        ): O.Option<PositionedModule[]> => {
                          const target = {
                            structuredDna: {
                              ...module.structuredDna,
                              sectionType: st.code,
                            },
                          } as Module
                          const compatModules = pipe(
                            systemModules,
                            filterCompatibleModules()(target)
                          )
                          if (compatModules.length === 0) return O.none

                          return pipe(
                            compatModules,
                            topCandidateByHamming(target),
                            O.map((bestModule) => {
                              const distanceToTarget =
                                target.structuredDna.gridUnits -
                                bestModule.structuredDna.gridUnits
                              switch (true) {
                                case sign(distanceToTarget) > 0:
                                  // fill in some vanilla
                                  return [
                                    bestModule,
                                    ...A.replicate(
                                      distanceToTarget / vanillaModule.length,
                                      vanillaModule
                                    ),
                                  ]
                                case sign(distanceToTarget) < 0:
                                  // abort and only vanilla
                                  return A.replicate(
                                    module.length / vanillaModule.length,
                                    vanillaModule
                                  )

                                case sign(distanceToTarget) === 0:
                                default:
                                  return [bestModule]
                                // swap the module
                              }
                            }),
                            O.map((nextModules) =>
                              pipe(
                                acc,
                                O.map((positionedModules) => [
                                  ...positionedModules,
                                  ...nextModules.map(
                                    (module, i) =>
                                      ({
                                        module,
                                        z,
                                        gridGroupIndex: i,
                                      } as PositionedModule)
                                  ),
                                ])
                              )
                            ),
                            O.flatten
                          )
                        }
                      ),
                      O.map(
                        (modules): GridGroup => ({
                          ...gridGroupRest,
                          modules,
                        })
                      )
                    )
                  } catch (e) {
                    return O.none
                  }
                }
              ),
              O.map((gridGroups) => ({
                ...columnRest,
                gridGroups,
              }))
            )
        ),
        O.map((columnLayout): AugSectionType => {
          const houseDna = columnLayoutToDNA(columnLayout)
          return {
            ...st,
            dx: (st.width - houseWidth) / 2,
            houseDna,
            houseDnaKey: houseDna.toString(),
          }
        })
      )
    ),
    A.sort(
      pipe(
        Num.Ord,
        Ord.contramap((st: AugSectionType) => st.width)
      )
    ),
    (as) =>
      A.isNonEmpty(as)
        ? as
        : ((): any => {
            throw new Error("empty section types")
          })()
  )

  const canStretchWidth = augSectionTypes.length > 1

  const maxWidth = pipe(augSectionTypes, NEA.last, (x) => x.width)

  const minWidth = pipe(augSectionTypes, NEA.head, (x) => x.width)

  useSubscribeKey(stretchWidthRaw, houseId, () => {
    if (!stretchWidthRaw[houseId]) return

    const { dx, dz, direction, distance } = stretchWidthRaw[houseId]
    const { width: houseWidth } = dimensions[houseId]

    const dxd = direction * distance

    const clampedDistance = min(
      max(dxd, -(houseWidth - minWidth) / 2),
      (maxWidth - houseWidth) / 2
    )

    stretchWidthClamped[houseId] = {
      dx,
      dz,
      distance: clampedDistance,
    }
  })

  const currentIndex = augSectionTypes.findIndex(
    (x) => x.code === module0.structuredDna.sectionType
  )

  useEffect(() => {
    pipe(
      augSectionTypes,
      NEA.mapWithIndex((i, augSectionType) => {
        if (i === currentIndex) return

        const key = augSectionType.houseDna.toString()

        previews[houseId].dna[key] = {
          active: false,
          value: ref(augSectionType.houseDna),
        }
      })
    )

    return () => {
      pipe(
        augSectionTypes,
        NEA.mapWithIndex((i, augSectionType) => {
          if (i === currentIndex) return

          const key = augSectionType.houseDna.toString()
          delete previews[houseId].dna[key]
        })
      )
    }
  }, [houseId, augSectionTypes, currentIndex])

  const lastDistance = useRef(0)
  const previewIndex = useRef<number | null>(null)

  useSubscribeKey(stretchWidthClamped, houseId, () => {
    if (!stretchWidthClamped[houseId]) return
    const { distance } = stretchWidthClamped[houseId]

    const direction = sign(distance - lastDistance.current) as Ordering

    lastDistance.current = distance

    leftHandleRef.current.position.x = distance
    rightHandleRef.current.position.x = -distance

    switch (direction) {
      case -1: {
        const i = augSectionTypes.findIndex((x) => distance - x.dx > 0.001)

        if (i !== -1) {
          if (previewIndex.current !== null) {
            const lastKey = augSectionTypes[previewIndex.current].houseDnaKey
            if (lastKey in previews[houseId].dna)
              previews[houseId].dna[lastKey].active = false
          }

          if (i === currentIndex) {
            break
          }
          previewIndex.current = i

          const key = augSectionTypes[i].houseDnaKey
          if (key in previews[houseId].dna)
            previews[houseId].dna[key].active = true
        }
        break
      }
      default:
      case 1: {
        const i = augSectionTypes.findIndex((x) => distance - x.dx < 0.001)

        if (i !== -1) {
          if (previewIndex.current !== null) {
            const lastKey = augSectionTypes[previewIndex.current].houseDnaKey
            if (lastKey in previews[houseId].dna)
              previews[houseId].dna[lastKey].active = false
          }

          if (i === currentIndex) {
            break
          }
          previewIndex.current = i

          const key = augSectionTypes[i].houseDnaKey
          if (key in previews[houseId].dna)
            previews[houseId].dna[key].active = true
        }
        break
      }
    }

    invalidate()
  })

  const { dna } = useHouse(houseId)

  useEffect(() => {
    leftHandleRef.current.position.set(0, 0, 0)
    rightHandleRef.current.position.set(0, 0, 0)
  }, [dna])

  return (
    <group
      ref={rootRef}
      scale={isStretchable && canStretchWidth ? [1, 1, 1] : [0, 0, 0]}
      {...groupProps}
    >
      <StretchHandle
        ref={leftHandleRef}
        houseId={houseId}
        axis="x"
        direction={1}
      />
      <StretchHandle
        ref={rightHandleRef}
        houseId={houseId}
        axis="x"
        direction={-1}
      />
    </group>
  )
})

export default StretchWidth
