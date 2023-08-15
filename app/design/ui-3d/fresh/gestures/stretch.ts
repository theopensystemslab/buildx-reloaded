import { takeRight } from "fp-ts/lib/Array"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Object3D, Vector3 } from "three"
import { A, O, T } from "../../../../utils/functions"
import {
  addDebugLineAtZ,
  setInvisibleNoRaycast,
  setVisibleAndRaycast,
} from "../../../../utils/three"
import pointer from "../../../state/pointer"
import { recomputeLayoutGroup } from "../dimensions"
import { createColumnGroup, splitColumnGroups } from "../helpers/layouts"
import {
  getActiveHouseUserData,
  getActiveLayoutGroup,
  getHouseTransformsGroupUp,
  getSortedVisibleColumnGroups,
  handleColumnGroupParentQuery,
} from "../helpers/sceneQueries"
import {
  ColumnGroup,
  HouseLayoutGroup,
  HouseTransformsGroup,
  incrementColumnCount,
  StretchHandleMesh,
  StretchHandleMeshUserData,
} from "../userData"

const TMP_MAX_LENGTH = 10

const DEBUG_FENCES = true

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

  const addInvisibleVanillaToEnd = () => {
    if (!stretchZInitialDataRef.current) return

    const { templateVanillaColumnGroup, layoutGroup, vanillaLength } =
      stretchZInitialDataRef.current
    const { fences } = stretchZProgressDataRef.current

    const lastColumnGroup = fences[fences.length - 1].columnGroup

    const columnGroup = templateVanillaColumnGroup.clone()

    columnGroup.userData.columnIndex = lastColumnGroup.userData.columnIndex + 1

    columnGroup.position.z =
      lastColumnGroup.position.z +
      lastColumnGroup.userData.length / 2 +
      columnGroup.userData.length / 2

    setInvisibleNoRaycast(columnGroup)

    layoutGroup.add(columnGroup)

    fences.push({
      columnGroup,
      z: columnGroup.position.z,
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
                    const z =
                      columnGroup.position.z + columnGroup.userData.length
                    return {
                      columnGroup,
                      z,
                    }
                  })
                )
                stretchZProgressDataRef.current.fenceIndex =
                  stretchZProgressDataRef.current.fences.length - 1

                for (let i = 0; i < 3; i++) {
                  addInvisibleVanillaToEnd()
                }
              }

              if (direction === -1) {
                // complete me
              }
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
      } = stretchZInitialDataRef.current

      const { lastDistance, fences: vanillaFences } =
        stretchZProgressDataRef.current

      const [x1, z1] = pointer.xz
      const distanceVector = new Vector3(x1, 0, z1).sub(point0)
      distanceVector.applyAxisAngle(
        new Vector3(0, 1, 0),
        -houseTransformsGroup.rotation.y
      )
      const distance = distanceVector.z * direction
      handleGroup.position.set(0, 0, handleGroupZ0 + distance * direction)

      const { fenceIndex, fences } = stretchZProgressDataRef.current

      if (direction === 1) {
        // additive direction to back side
        if (distance > lastDistance) {
          if (fenceIndex + 1 < fences.length) {
            const nextFence = fences[fenceIndex + 1]
            const realDistance = midEndZ + distance
            if (realDistance >= nextFence.z) {
              setVisibleAndRaycast(nextFence.columnGroup)
              endColumnGroup.userData.columnIndex++
              stretchZProgressDataRef.current.fenceIndex++

              if (nextFence.z < maxLength) {
                addInvisibleVanillaToEnd()
              }
            }
          }
        }

        // subtractive direction to back side
        if (distance < lastDistance) {
          if (fenceIndex > 0) {
            const realDistance = midEndZ + distance
            const lastVisibleFence = fences[fenceIndex]

            if (
              realDistance <
              lastVisibleFence.z - lastVisibleFence.columnGroup.userData.length
            ) {
              setInvisibleNoRaycast(lastVisibleFence.columnGroup)
              stretchZProgressDataRef.current.fenceIndex--
              endColumnGroup.userData.columnIndex--
            }
          }
        }
      }

      stretchZProgressDataRef.current.lastDistance = distance

      return

      // additive
      if (distance > lastDistance) {
        // prob check if we need to add some hidden ones
        if (undefined as any) {
        }

        // gate check
        if (distance > vanillaLength * vanillaFences.length) {
          const newColumnGroup = templateVanillaColumnGroup.clone()

          if (direction === 1) {
            const penultimateColumnGroup = columnGroups[columnGroups.length - 2]
            const endColumnGroup = columnGroups[columnGroups.length - 1]

            newColumnGroup.position.setZ(
              penultimateColumnGroup.position.z +
                penultimateColumnGroup.userData.length / 2 +
                (vanillaFences.length + 0.5) * vanillaLength
            )

            layoutGroup.add(newColumnGroup)

            newColumnGroup.userData.columnIndex =
              penultimateColumnGroup.userData.columnIndex + 1

            endColumnGroup.userData.columnIndex++

            incrementColumnCount(layoutGroup)

            stretchZProgressDataRef.current.fences.push({
              columnGroup: newColumnGroup,
              z: distance,
            })

            recomputeLayoutGroup(layoutGroup)
          }

          if (direction === -1) {
            // newColumnGroup.position.setZ(
            //   secondColumnGroup.position.z +
            //     penultimateColumnGroup.userData.length / 2 +
            //     (vanillaColumnGroups.length + 0.5) * vanillaLength
            // )
            // layoutGroup.add(newColumnGroup)
          }
        }
      }

      // subtractive
      if (distance < lastDistance) {
        // gate check
        if (distance > 0 && vanillaFences.length > 0) {
          pipe(
            vanillaFences,
            A.last,
            O.map(({ z, columnGroup }) => {
              if (distance < z) {
                columnGroup.removeFromParent()
                vanillaFences.pop()
              }
            })
          )
          // if (distance < stretchZProgressDataRef.current.vanillaFences) {
          //   // we want to be tracking vanilla columns first
          //   // otherwise
          // }
        }

        if (distance < 0) {
          // column group fence stuff here
          // we would want to track an index and vis vs. no vis
        }
      }
    },
    last: () => {
      if (!stretchZInitialDataRef.current) return
      const { layoutGroup, endColumnGroup } = stretchZInitialDataRef.current

      pipe(
        layoutGroup,
        getSortedVisibleColumnGroups,
        takeRight(2),
        ([penultimateColumnGroup]) => {
          endColumnGroup.position.setZ(
            penultimateColumnGroup.position.z +
              penultimateColumnGroup.userData.length / 2
          )
        }
      )

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
