// import { useSystemData } from "@/contexts/SystemsData"
// import {
//   filterCompatibleModules,
//   StructuredDnaModule,
//   topCandidateByHamming,
// } from "@/data/module"
// import { SectionType } from "@/data/sectionType"
// import {
//   ColumnLayout,
//   columnLayoutToDNA,
//   GridGroup,
//   PositionedColumn,
//   PositionedModule,
// } from "@/hooks/layouts"
// import { useGetVanillaModule } from "@/hooks/modules"
// import {
//   filterA,
//   filterMapA,
//   flattenO,
//   mapO,
//   mapToOption,
//   notNullish,
//   NumOrd,
//   reduceA,
//   reduceToOption,
// } from "@/utils"
// import { Foldable, isNonEmpty, replicate, sort } from "fp-ts/lib/Array"
// import { pipe } from "fp-ts/lib/function"
// import { head, NonEmptyArray } from "fp-ts/lib/NonEmptyArray"
// import { none, Option, some, toNullable } from "fp-ts/lib/Option"
// import { contramap } from "fp-ts/lib/Ord"
// import { last } from "fp-ts/lib/ReadonlyNonEmptyArray"
// import { fromFoldable, keys } from "fp-ts/lib/Record"
// import { first } from "fp-ts/lib/Semigroup"
// import { useMemo, useState } from "react"
// import houses from "../houses"

import { pipe } from "fp-ts/lib/function"
import { RefObject, useMemo, useState } from "react"
import { Group } from "three"
import {
  filterCompatibleModules,
  Module,
  topCandidateByHamming,
  useSystemModules,
} from "../../data/modules"
import { SectionType, useSystemSectionTypes } from "../../data/sectionTypes"
import {
  A,
  guardNotNullish,
  mapToOption,
  NEA,
  Num,
  O,
  Ord,
  R,
  reduceToOption,
  SG,
} from "../../utils/functions"
import { abs, sign } from "../../utils/math"
import houses from "../houses"
import {
  ColumnLayout,
  columnLayoutToDNA,
  GridGroup,
  PositionedColumn,
  PositionedModule,
} from "../layouts"
import { useGetVanillaModule } from "../vanilla"

export const useStretchWidth = (
  houseId: string,
  columnLayout: ColumnLayout,
  houseRefs: Array<RefObject<Group>>
) => {
  // const { sectionTypes, modules: systemModules } = useSystemData()

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
    [current, ...options],
    A.filterMap((st) =>
      pipe(
        columnLayout,
        mapToOption(
          ({ gridGroups, ...columnRest }): O.Option<PositionedColumn> => {
            const foo = pipe(
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
            return foo
          }
        ),
        O.map((columnLayout): [string, string[]] => [
          st.code,
          columnLayoutToDNA(columnLayout as ColumnLayout),
        ])
      )
    ),
    R.fromFoldable(SG.first<string[]>(), A.Foldable)
  )

  console.log(dnaChangeOptions)

  const canStretchWidth = true // todo

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

  const [stIndex, setSTIndex] = useState(-1)

  const gateLineX = useMemo(() => {
    if (stIndex === -1) return current.width / 2
    return sortedSTs[stIndex].width / 2
  }, [stIndex])

  const sendWidthDrag = (x: number) => {
    const absX = abs(x)

    let distance = Infinity,
      index = -1

    for (let i = 0; i < sortedSTs.length; i++) {
      const st = sortedSTs[i]
      const d = abs(st.width / 2 - absX)
      if (d < distance) {
        distance = d
        index = i
      }
    }

    setSTIndex(index)
  }

  const sendWidthDrop = () => {
    const st = sortedSTs[stIndex]
    const dnaChange = dnaChangeOptions[st.code]
    if (dnaChange !== houses[houseId].dna) houses[houseId].dna = dnaChange
  }

  return {
    canStretchWidth,
    minWidth,
    maxWidth,
    gateLineX,
    sendWidthDrag,
    sendWidthDrop,
  }
}
