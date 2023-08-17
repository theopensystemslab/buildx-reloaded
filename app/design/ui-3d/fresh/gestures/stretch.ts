import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Object3D, Vector3 } from "three"
import { A, T } from "../../../../utils/functions"
import {
  setInvisibleNoRaycast,
  setVisibleAndRaycast,
  yAxis,
} from "../../../../utils/three"
import pointer from "../../../state/pointer"
import { recomputeLayoutGroup } from "../dimensions"
import { dispatchOutline } from "../events/outlines"
import { createColumnGroup, splitColumnGroups } from "../helpers/layouts"
import {
  getActiveHouseUserData,
  getActiveLayoutGroup,
  getHouseTransformsGroupUp,
  getSortedVisibleColumnGroups,
  getVisibleColumnGroups,
  handleColumnGroupParentQuery,
} from "../helpers/sceneQueries"
import {
  ColumnGroup,
  HouseLayoutGroup,
  HouseTransformsGroup,
  StretchHandleMesh,
  StretchHandleMeshUserData,
} from "../userData"

const TMP_MAX_LENGTH = 10

const useOnDragStretch = () => {
  const stretchZInitialDataRef = useRef<{
    direction: number
    point0: Vector3
    handleGroup: Object3D
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

  type Fence = {
    z: number
    columnGroup: ColumnGroup
  }

  const stretchZProgressDataRef = useRef<{
    fences: Fence[]
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
      handleObject,
      point,
    }: {
      handleObject: StretchHandleMesh
      point: Vector3
    }) => {
      dispatchOutline({
        hoveredObjects: [],
        selectedObjects: [],
      })

      const handleGroup = handleColumnGroupParentQuery(handleObject)
      const houseTransformsGroup = getHouseTransformsGroupUp(handleGroup)

      const { direction } = handleObject.userData
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
                direction,
                handleGroup,
                layoutGroup,
                houseTransformsGroup,
                point0: point,
                handleGroupZ0: handleGroup.position.z,
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

              if (direction === 1) {
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
                  addVanilla(direction)
                }
                console.log(`fences 1`)
                console.log(
                  stretchZProgressDataRef.current.fences.map(
                    ({ columnGroup, z }) => [
                      columnGroup.userData.columnIndex,
                      z,
                    ]
                  )
                )
              }

              if (direction === -1) {
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
                  addVanilla(direction)
                }
              }

              const { fenceIndex, fences } = stretchZProgressDataRef.current

              console.log({
                fenceIndex,
                fences: stretchZProgressDataRef.current.fences.map(
                  ({ columnGroup, z }) => [columnGroup.userData.columnIndex, z]
                ),
                fence: fences[fenceIndex],
              })
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
        handleGroup,
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

      const { lastDistance, fences: vanillaFences } =
        stretchZProgressDataRef.current

      const [x1, z1] = pointer.xz
      const distanceVector = new Vector3(x1, 0, z1).sub(point0)
      distanceVector.applyAxisAngle(
        new Vector3(0, 1, 0),
        -houseTransformsGroup.rotation.y
      )
      const distance = distanceVector.z

      handleGroup.position.set(0, 0, handleGroupZ0 + distance)

      const { fenceIndex, fences } = stretchZProgressDataRef.current

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

      recomputeLayoutGroup(layoutGroup)

      stretchZInitialDataRef.current = null
      stretchZProgressDataRef.current = {
        lastDistance: 0,
        fences: [],
        fenceIndex: 0,
      }
    },
  }

  const stretchXData = useRef<{} | null>(null)

  const onDragStretchX = {
    first: (stretchHandleUserData: StretchHandleMeshUserData) => {},
    mid: (stretchHandleUserData: StretchHandleMeshUserData) => {},
    last: (stretchHandleUserData: StretchHandleMeshUserData) => {},
  }

  return { onDragStretchZ, onDragStretchX }
}

export default useOnDragStretch
