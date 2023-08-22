import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Object3D, Vector3 } from "three"
import { A, O, someOrError, T } from "../../../../utils/functions"
import {
  setInvisibleNoRaycast,
  setVisibility,
  setVisibleAndRaycast,
  yAxis,
} from "../../../../utils/three"
import pointer from "../../../state/pointer"
import { updateLayoutGroupLength } from "../dimensions"
import { dispatchOutline } from "../events/outlines"
import {
  getActiveHouseUserData,
  getActiveLayoutGroup,
  getHouseTransformsGroupUp,
  getPartitionedLayoutGroups,
  getSortedVisibleColumnGroups,
  getVisibleColumnGroups,
  handleColumnGroupParentQuery,
  sortLayoutGroupsByWidth,
} from "../helpers/sceneQueries"
import { createColumnGroup, splitColumnGroups } from "../scene/columnGroup"
import {
  ColumnGroup,
  HouseLayoutGroup,
  HouseTransformsGroup,
  isStretchHandleGroup,
  StretchHandleGroup,
} from "../userData"

const TMP_MAX_LENGTH = 10

const useOnDragStretch = () => {
  const stretchZInitialDataRef = useRef<{
    direction: number
    point0: Vector3
    handleColumnGroup: Object3D
    houseTransformsGroup: HouseTransformsGroup
    layoutGroup: HouseLayoutGroup
    handleGroupZ0: number
    columnGroups: Object3D[]
    startColumnGroup: Object3D
    midColumnGroups: Object3D[]
    endColumnGroup: ColumnGroup
    templateVanillaColumnGroup: ColumnGroup
    vanillaLength: number
    maxLength: number
    midStartZ: number
    midEndZ: number
  } | null>(null)

  type FenceZ = {
    z: number
    columnGroup: ColumnGroup
  }

  const stretchZProgressDataRef = useRef<{
    fences: FenceZ[]
    lastDistance: number
    fenceIndex: number
  }>({
    fences: [],
    lastDistance: 0,
    fenceIndex: 0,
  })

  const addVanilla = (side: 1 | -1) => {
    if (!stretchZInitialDataRef.current) return

    const { templateVanillaColumnGroup, layoutGroup } =
      stretchZInitialDataRef.current

    const { fences } = stretchZProgressDataRef.current

    const lastColumnGroup = fences[fences.length - 1].columnGroup
    const columnGroup = templateVanillaColumnGroup.clone()

    let z = 0
    if (side === 1) {
      z = lastColumnGroup.position.z + lastColumnGroup.userData.length
    } else if (side === -1) {
      z = lastColumnGroup.position.z - columnGroup.userData.length
    }

    columnGroup.position.setZ(z)

    setInvisibleNoRaycast(columnGroup)

    layoutGroup.add(columnGroup)

    fences.push({
      columnGroup,
      z: z + columnGroup.userData.length / 2,
    })
  }

  const onDragStretchZ = {
    first: ({
      handleGroup,
      point,
    }: {
      handleGroup: StretchHandleGroup
      point: Vector3
    }) => {
      dispatchOutline({
        hoveredObjects: [],
        selectedObjects: [],
      })

      const handleColumnGroup = handleColumnGroupParentQuery(handleGroup)
      const houseTransformsGroup = getHouseTransformsGroupUp(handleColumnGroup)

      const { side } = handleGroup.userData
      const { systemId, houseId, vanillaColumn } =
        getActiveHouseUserData(houseTransformsGroup)

      const layoutGroup = getActiveLayoutGroup(houseTransformsGroup)
      const columnGroups = pipe(layoutGroup, getSortedVisibleColumnGroups)

      const task = pipe(
        T.of(vanillaColumn),
        T.chain(({ gridGroups }) =>
          pipe(
            createColumnGroup({
              systemId,
              houseId,
              gridGroups,
              columnIndex: -1,
            }),
            T.map((templateVanillaColumnGroup) => {
              const { startColumnGroup, midColumnGroups, endColumnGroup } =
                splitColumnGroups(columnGroups)

              const vanillaLength = templateVanillaColumnGroup.userData.length

              stretchZInitialDataRef.current = {
                direction: side,
                handleColumnGroup: handleColumnGroup,
                layoutGroup,
                houseTransformsGroup,
                point0: point,
                handleGroupZ0: handleColumnGroup.position.z,
                templateVanillaColumnGroup,
                vanillaLength,
                columnGroups,
                startColumnGroup,
                midColumnGroups,
                endColumnGroup,
                maxLength: TMP_MAX_LENGTH,
                midStartZ: startColumnGroup.userData.length,
                midEndZ: endColumnGroup.position.z,
              }

              if (side === 1) {
                stretchZProgressDataRef.current.fences = pipe(
                  midColumnGroups,
                  A.map((columnGroup) => {
                    return {
                      columnGroup,
                      z:
                        columnGroup.position.z +
                        columnGroup.userData.length / 2,
                    }
                  })
                )
                stretchZProgressDataRef.current.fenceIndex =
                  stretchZProgressDataRef.current.fences.length - 1

                for (let i = 0; i < 3; i++) {
                  addVanilla(side)
                }
              }

              if (side === -1) {
                stretchZProgressDataRef.current.fences = pipe(
                  midColumnGroups,
                  A.reverse,
                  A.map((columnGroup) => {
                    const z = columnGroup.position.z
                    return {
                      columnGroup,
                      z,
                    }
                  })
                )
                stretchZProgressDataRef.current.fenceIndex =
                  stretchZProgressDataRef.current.fences.length - 1

                for (let i = 0; i < 3; i++) {
                  addVanilla(side)
                }
              }

              console.log(stretchZProgressDataRef.current.fences)
            })
          )
        )
      )

      task()
    },
    mid: () => {
      if (!stretchZInitialDataRef.current) return

      const {
        direction,
        point0,
        houseTransformsGroup,
        handleColumnGroup,
        handleGroupZ0,
        vanillaLength,
        templateVanillaColumnGroup,
        columnGroups,
        layoutGroup,
        endColumnGroup,
        maxLength,
        midEndZ,
        midStartZ,
      } = stretchZInitialDataRef.current

      const { lastDistance, fences, fenceIndex } =
        stretchZProgressDataRef.current

      const [x1, z1] = pointer.xz
      const distanceVector = new Vector3(x1, 0, z1).sub(point0)
      distanceVector.applyAxisAngle(
        new Vector3(0, 1, 0),
        -houseTransformsGroup.rotation.y
      )
      const distance = distanceVector.z

      handleColumnGroup.position.setZ(handleGroupZ0 + distance)

      // back side
      if (direction === 1) {
        // const cl = clamp(lo, hi)

        // additive direction to back side
        if (distance > lastDistance) {
          if (fenceIndex + 1 < fences.length) {
            const nextFence = fences[fenceIndex + 1]
            const realDistance = midEndZ + distance
            if (realDistance >= nextFence.z) {
              setVisibleAndRaycast(nextFence.columnGroup)
              endColumnGroup.userData.columnIndex++
              nextFence.columnGroup.userData.columnIndex =
                endColumnGroup.userData.columnIndex - 1
              stretchZProgressDataRef.current.fenceIndex++
              houseTransformsGroup.userData.syncWidthHandles()

              if (nextFence.z < maxLength) {
                addVanilla(direction)
              }
            }
          }
        }

        // subtractive direction to back side
        if (distance < lastDistance) {
          if (fenceIndex > 0) {
            const realDistance = midEndZ + distance
            const lastVisibleFence = fences[fenceIndex]

            if (realDistance < lastVisibleFence.z) {
              setInvisibleNoRaycast(lastVisibleFence.columnGroup)
              stretchZProgressDataRef.current.fenceIndex--
              lastVisibleFence.columnGroup.userData.columnIndex = -1
              endColumnGroup.userData.columnIndex--
              houseTransformsGroup.userData.syncWidthHandles()
            }
          }
        }
      }

      // front side
      if (direction === -1) {
        // const cl = clamp(lo, hi)
        // additive direction to front side
        if (distance < lastDistance) {
          if (fenceIndex + 1 < fences.length) {
            const nextFence = fences[fenceIndex + 1]
            const realDistance = midStartZ + distance
            if (realDistance <= nextFence.z) {
              setVisibleAndRaycast(nextFence.columnGroup)

              pipe(
                layoutGroup,
                getVisibleColumnGroups,
                A.filter((x) => x.userData.columnIndex >= 1)
              ).forEach((columnGroup) => {
                columnGroup.userData.columnIndex++
              })

              nextFence.columnGroup.userData.columnIndex = 1

              stretchZProgressDataRef.current.fenceIndex++
              houseTransformsGroup.userData.syncWidthHandles()

              // naive
              if (nextFence.z < maxLength) {
                addVanilla(direction)
              }
            }
          }
        }
        // subtractive direction to front side
        if (distance > lastDistance) {
          if (fenceIndex > 0) {
            const realDistance = midStartZ + distance
            const lastVisibleFence = fences[fenceIndex]

            if (realDistance > lastVisibleFence.z) {
              setInvisibleNoRaycast(lastVisibleFence.columnGroup)

              lastVisibleFence.columnGroup.userData.columnIndex = -1

              pipe(
                layoutGroup,
                getVisibleColumnGroups,
                A.filter((x) => x.userData.columnIndex > 1)
              ).forEach((columnGroup) => {
                columnGroup.userData.columnIndex--
              })
              stretchZProgressDataRef.current.fenceIndex--
              houseTransformsGroup.userData.syncWidthHandles()
            }
          }
        }
      }

      stretchZProgressDataRef.current.lastDistance = distance
    },
    last: () => {
      if (!stretchZInitialDataRef.current) return

      const { layoutGroup, direction, houseTransformsGroup } =
        stretchZInitialDataRef.current

      const sortedVisibleColumnGroups = pipe(
        layoutGroup,
        getSortedVisibleColumnGroups
      )

      if (direction === 1) {
        pipe(
          sortedVisibleColumnGroups,
          A.takeRight(2),
          ([penultimateColumnGroup, endColumnGroup]) => {
            endColumnGroup.position.setZ(
              penultimateColumnGroup.position.z +
                penultimateColumnGroup.userData.length
            )
          }
        )
      }

      if (direction === -1) {
        pipe(
          sortedVisibleColumnGroups,
          A.takeLeft(2),
          ([startColumnGroup, secondColumnGroup]) => {
            startColumnGroup.position.setZ(
              secondColumnGroup.position.z - startColumnGroup.userData.length
            )
          }
        )

        const delta = -sortedVisibleColumnGroups[0].position.z

        sortedVisibleColumnGroups.forEach((columnGroup) => {
          columnGroup.position.z += delta
        })

        houseTransformsGroup.position.sub(
          new Vector3(0, 0, delta).applyAxisAngle(
            yAxis,
            houseTransformsGroup.rotation.y
          )
        )
      }

      updateLayoutGroupLength(layoutGroup)

      stretchZInitialDataRef.current = null
      stretchZProgressDataRef.current = {
        lastDistance: 0,
        fences: [],
        fenceIndex: 0,
      }
    },
  }

  type FenceX = {
    x: number
    layoutGroup: HouseLayoutGroup
  }

  const stretchXData = useRef<{
    point0: Vector3
    handleGroupX0: number
    houseTransformsGroup: HouseTransformsGroup
    handleGroup: StretchHandleGroup
    otherSideHandleGroup: StretchHandleGroup
    otherSideHandleGroupX0: number
    fences: FenceX[]
    fenceIndex: number
    lastDistance: number
  } | null>(null)

  const onDragStretchX = {
    first: ({
      point,
      handleGroup,
    }: {
      handleGroup: StretchHandleGroup
      point: Vector3
    }) => {
      dispatchOutline({
        hoveredObjects: [],
        selectedObjects: [],
      })

      const { side } = handleGroup.userData
      const otherSide = side * -1

      const houseTransformsGroup = getHouseTransformsGroupUp(handleGroup)
      const { activeLayoutGroup, otherLayoutGroups } =
        getPartitionedLayoutGroups(houseTransformsGroup)

      const otherSideHandleGroup = pipe(
        houseTransformsGroup.children,
        A.findFirst((x): x is StretchHandleGroup => {
          return (
            isStretchHandleGroup(x) &&
            x.userData.axis === "x" &&
            x.userData.side === otherSide
          )
        }),
        someOrError(`other side handle group not found`)
      )

      let fenceIndex = 0

      const fences = pipe(
        [activeLayoutGroup, ...otherLayoutGroups],
        sortLayoutGroupsByWidth,
        A.mapWithIndex((i, layoutGroup): FenceX => {
          if (layoutGroup.uuid === activeLayoutGroup.uuid) fenceIndex = i
          return {
            layoutGroup,
            x:
              (layoutGroup.userData.width - activeLayoutGroup.userData.width) /
              2,
          }
        })
      )

      stretchXData.current = {
        handleGroup,
        otherSideHandleGroup,
        otherSideHandleGroupX0: otherSideHandleGroup.position.x,
        houseTransformsGroup,
        point0: point,
        fences,
        handleGroupX0: handleGroup.position.x,
        fenceIndex,
        lastDistance: 0,
      }
    },
    mid: () => {
      if (!stretchXData.current) return

      const {
        point0,
        houseTransformsGroup,
        handleGroup,
        handleGroupX0,
        otherSideHandleGroup,
        otherSideHandleGroupX0,
        fences,
        fenceIndex,
        lastDistance,
      } = stretchXData.current

      const { side } = handleGroup.userData

      const [x1, z1] = pointer.xz
      const distanceVector = new Vector3(x1, 0, z1).sub(point0)
      distanceVector.applyAxisAngle(
        new Vector3(0, 1, 0),
        -houseTransformsGroup.rotation.y
      )
      const distance = distanceVector.x
      handleGroup.position.setX(handleGroupX0 + distance)
      otherSideHandleGroup.position.setX(otherSideHandleGroupX0 - distance)

      const adjustedDistance = side * distance
      const adjustedLastDistance = side * lastDistance

      if (adjustedDistance > adjustedLastDistance) {
        pipe(
          fences,
          A.lookup(fenceIndex + 1),
          O.map(({ x }) => {
            if (adjustedDistance >= x) {
              // swap it
              setVisibility(fences[fenceIndex + 1].layoutGroup, true)
              setVisibility(fences[fenceIndex].layoutGroup, false)
              stretchXData.current!.fenceIndex++
            }
          })
        )
      } else if (adjustedDistance < adjustedLastDistance) {
        pipe(
          fences,
          A.lookup(fenceIndex - 1),
          O.map(({ x }) => {
            if (adjustedDistance >= x) {
              setVisibility(fences[fenceIndex].layoutGroup, true)
              setVisibility(fences[fenceIndex + 1].layoutGroup, false)
              stretchXData.current!.fenceIndex--
            }
          })
        )
        // tbc
      }
      // if next fence up
    },
    last: () => {},
  }

  return { onDragStretchZ, onDragStretchX }
}

export default useOnDragStretch
