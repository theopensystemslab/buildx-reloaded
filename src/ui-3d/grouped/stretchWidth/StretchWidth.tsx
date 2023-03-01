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
import PhonyDnaHouse from "@/ui-3d/grouped/stretchWidth/PhonyDnaHouse"
import {
  A,
  mapToOption,
  NEA,
  Num,
  O,
  Ord,
  pipeEffect,
  R,
  reduceToOption,
  SG,
} from "@/utils/functions"
import { useSubscribeKey } from "@/utils/hooks"
import { max, min, sign } from "@/utils/math"
import { GroupProps, invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Ordering } from "fp-ts/lib/Ordering"
import { forwardRef, PropsWithChildren, useEffect, useRef } from "react"
import { Group } from "three"
import { proxy, ref } from "valtio"
import previews from "../../../hooks/previews"
import { useIsStretchable } from "../../../hooks/siteCtx"
import StretchHandle from "../../handles/StretchHandle"

export type StretchWidth = {
  direction: 1 | -1
  dx: number
  dz: number
  distance: number
}

export const stretchWidthRaw = proxy<Record<string, StretchWidth>>({})
export const stretchWidthClamped = proxy<Record<string, StretchWidth>>({})

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

  const { current, options } = pipe(
    sectionTypes,
    A.reduce(
      { current: null, options: [] },
      (
        {
          current,
          options,
        }: { current: SectionType | null; options: SectionType[] },
        st
      ) =>
        st.code === module0.structuredDna.sectionType
          ? {
              current: st,
              options,
            }
          : {
              current,
              options: [...options, st],
            }
    ),
    ({ current, options }) => ({
      current: current as SectionType,
      options,
    })
  )

  const dnaChangeOptions = pipe(
    // [current, ...options],
    options,
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
        O.map((columnLayout): [string, string[]] => [
          st.code,
          columnLayoutToDNA(columnLayout as ColumnLayout),
        ])
      )
    ),
    R.fromFoldable(SG.first<string[]>(), A.Foldable)
  )

  const canStretchWidth = options.length > 0

  const sortedSTs: NEA.NonEmptyArray<SectionType> = pipe(
    sectionTypes,
    A.filter((st) => R.keys(dnaChangeOptions).includes(st.code)),
    A.sort(
      pipe(
        Num.Ord,
        Ord.contramap((st: SectionType) => st.width)
      )
    ),
    (sts) => {
      if (!A.isNonEmpty(sts)) throw new Error("Empty section types")
      return sts
    }
  )

  const maxWidth = pipe(sortedSTs, NEA.last, (x) => x.width)

  const minWidth = pipe(sortedSTs, NEA.head, (x) => x.width)

  const { width: houseWidth } = useHouseDimensionsUpdates(houseId)

  useSubscribeKey(stretchWidthRaw, houseId, () => {
    if (!stretchWidthRaw[houseId]) return

    const { dx, dz, direction, distance } = stretchWidthRaw[houseId]
    const { width: houseWidth } = dimensions[houseId]

    const dxd = direction * distance

    const clampedDistance = min(
      max(dxd, (houseWidth - minWidth) / 2),
      (maxWidth - houseWidth) / 2
    )

    stretchWidthClamped[houseId] = {
      dx,
      dz,
      direction,
      distance: clampedDistance,
    }
  })

  useEffect(() => {
    pipe(
      dnaChangeOptions,
      R.map((dnaChangeOption) => {
        const key = dnaChangeOption.toString()
        previews[houseId].dna[key] = {
          active: false,
          value: ref(dnaChangeOption),
        }
      })
    )

    return () => {
      pipe(
        dnaChangeOptions,
        R.map((dnaChangeOption) => {
          const key = dnaChangeOption.toString()
          delete previews[houseId].dna[key]
        })
      )
    }
  }, [dnaChangeOptions, houseId])

  // smallest to largest
  const fences = pipe(
    sectionTypes,
    A.sort<SectionType>({
      compare(x, y) {
        return sign(x.width - y.width) as Ordering
      },
      equals(x, y) {
        return x.width === y.width
      },
    }),
    A.map((st): [number, SectionType] => [(st.width - houseWidth) / 2, st])
    // R.fromFoldable(SG.first<SectionType>(), A.Foldable)
  )

  // const fences = pipe(dnaChangeOptions, R.toEntries, A.map())

  const compute = (d: number) => {
    // options should be sorted by width
    // width should be mapped to distance target
    // if we're dragging UP then we're checking if we're ABOVE target
    // if we're dragging DOWN then we're checking we're BELOW target
    // probably leverage index to have array of distances vs. array with other info
    // switch (true) {
    //   case d === 0: {
    //     break
    //   }
    //   case d >= top: {
    //   }
    // }
  }

  useSubscribeKey(stretchWidthClamped, houseId, () => {
    if (!stretchWidthClamped[houseId]) return
    const { distance } = stretchWidthClamped[houseId]

    console.log({
      fences,
      distance,
    })

    // if (showDistance - distance < 0.0001) {
    //   ref.current.scale.set(1, 1, 1)
    //   invalidate()
    // } else {
    //   ref.current.scale.set(0, 0, 0)
    //   invalidate()
    // }
  })

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
