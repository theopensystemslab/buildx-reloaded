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
  R,
  reduceToOption,
  SG,
} from "@/utils/functions"
import { useSubscribeKey } from "@/utils/hooks"
import { max, min, sign } from "@/utils/math"
import { GroupProps, invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { forwardRef, PropsWithChildren, useRef } from "react"
import { Group } from "three"
import { proxy } from "valtio"
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

const StretchWidthShowHider = ({
  houseId,
  showDistance,
  children,
}: PropsWithChildren<{
  houseId: string
  showDistance: number
}>) => {
  const ref = useRef<Group>(null!)

  useSubscribeKey(stretchWidthClamped, houseId, () => {
    if (!stretchWidthClamped[houseId]) return
    const { distance } = stretchWidthClamped[houseId]

    if (showDistance - distance < 0.0001) {
      ref.current.scale.set(1, 1, 1)
      invalidate()
    } else {
      ref.current.scale.set(0, 0, 0)
      invalidate()
    }
  })

  return (
    <group ref={ref} scale={[0, 0, 0]}>
      {children}
    </group>
  )
}

type Props = GroupProps & {
  houseId: string
  setHouseVisible: (b: boolean) => void
  columnLayout: ColumnLayout
}

const StretchWidth = forwardRef<Group, Props>((props, ref) => {
  const { houseId, columnLayout, setHouseVisible, ...groupProps } = props

  const rightHandleRef = useRef<Group>(null!)
  const leftHandleRef = useRef<Group>(null!)

  const isStretchable = useIsStretchable(houseId)

  const systemId = "skylark"

  const systemModules = useSystemModules({ systemId })
  const sectionTypes = useSystemSectionTypes({ systemId })

  const getVanillaModule = useGetVanillaModule(systemId)

  const module0 = columnLayout[0].gridGroups[0].modules[0].module

  const sectionTypesByCode = pipe(
    sectionTypes,
    A.map((st): [string, SectionType] => [st.code, st]),
    R.fromFoldable(SG.first<SectionType>(), A.Foldable)
  )

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
    [current, ...options],
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

  return (
    <group
      ref={ref}
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
      {pipe(
        dnaChangeOptions,
        R.filterWithIndex((k) => k !== current.code),
        R.toArray,
        A.map(([k, dna]) => {
          return (
            <StretchWidthShowHider
              key={k}
              houseId={houseId}
              showDistance={(sectionTypesByCode[k].width - houseWidth) / 2}
            >
              <PhonyDnaHouse systemId={systemId} houseId={houseId} dna={dna} />
            </StretchWidthShowHider>
          )
        })
      )}
    </group>
  )
})

export default StretchWidth
