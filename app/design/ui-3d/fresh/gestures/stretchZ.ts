import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Object3D, Vector3 } from "three"
import { A, someOrError, T } from "../../../../utils/functions"
import { abs, floor, round, sign } from "../../../../utils/math"
import {
  setInvisibleNoRaycast,
  setVisibleAndRaycast,
  yAxis,
} from "../../../../utils/three"
import pointer from "../../../state/pointer"
import { dispatchOutline } from "../events/outlines"
import {
  findAllGuardDown,
  findFirstGuardAcross,
  findFirstGuardUp,
  getActiveHouseUserData,
  getHouseTransformsGroupUp,
  getSortedVisibleColumnGroups,
  getVisibleColumnGroups,
} from "../helpers/sceneQueries"
import { createColumnGroup, splitColumnGroups } from "../scene/columnGroup"
import {
  ColumnGroup,
  HouseLayoutGroup,
  HouseTransformsGroup,
  isColumnGroup,
  isModuleGroup,
  StretchHandleGroup,
} from "../scene/userData"

const TMP_MAX_LENGTH = 10

const useOnDragStretchZ = () => {
  const stretchZInitialDataRef = useRef<{
    side: 1 | -1
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

  const first = ({
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

    const houseTransformsGroup = getHouseTransformsGroupUp(handleGroup)
    const activeLayoutGroup = pipe(
      houseTransformsGroup.userData.getActiveLayoutGroup(),
      someOrError(`no active layout group in stretchZ`)
    )

    const { side } = handleGroup.userData
    const targetColumnIndex =
      side === -1 ? 0 : activeLayoutGroup.userData.activeColumnGroupCount - 1

    const handleColumnGroup = pipe(
      activeLayoutGroup,
      findFirstGuardAcross(
        (x): x is ColumnGroup =>
          isColumnGroup(x) && x.userData.columnIndex === targetColumnIndex
      ),
      someOrError(`no column group`)
    )

    houseTransformsGroup.userData.setXStretchHandlesVisible(false)

    const { systemId, houseId, vanillaColumn } =
      getActiveHouseUserData(houseTransformsGroup)

    const columnGroups = pipe(activeLayoutGroup, getSortedVisibleColumnGroups)

    const task = pipe(
      T.of(vanillaColumn),
      T.chain(({ gridGroups }) =>
        pipe(
          createColumnGroup({
            systemId,
            houseId,
            gridGroups,
            columnIndex: -1,
            houseTransformsGroup,
          }),
          T.map((templateVanillaColumnGroup) => {
            const { startColumnGroup, midColumnGroups, endColumnGroup } =
              splitColumnGroups(columnGroups)

            const vanillaLength = templateVanillaColumnGroup.userData.length

            stretchZInitialDataRef.current = {
              side,
              handleColumnGroup,
              layoutGroup: activeLayoutGroup,
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
                    z: columnGroup.position.z + columnGroup.userData.length / 2,
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
          })
        )
      )
    )

    task()
  }

  const mid = () => {
    if (!stretchZInitialDataRef.current) return

    const {
      side,
      point0,
      houseTransformsGroup,
      handleColumnGroup,
      handleGroupZ0,
      vanillaLength,
      layoutGroup,
      endColumnGroup,
      maxLength,
      midEndZ,
      midStartZ,
    } = stretchZInitialDataRef.current

    const { lastDistance, fences, fenceIndex } = stretchZProgressDataRef.current

    const [x1, z1] = pointer.xz
    const distanceVector = new Vector3(x1, 0, z1).sub(point0)
    distanceVector.applyAxisAngle(
      new Vector3(0, 1, 0),
      -houseTransformsGroup.rotation.y
    )
    const distance = distanceVector.z

    const direction = sign(distance - lastDistance) as 1 | -1

    // back side
    if (side === 1) {
      // const cl = clamp(lo, hi)

      // additive direction to back side
      if (direction === 1) {
        if (fenceIndex + 1 < fences.length) {
          const nextFence = fences[fenceIndex + 1]
          const realDistance = midEndZ + distance
          if (realDistance >= nextFence.z) {
            handleColumnGroup.position.setZ(nextFence.z)
            setVisibleAndRaycast(nextFence.columnGroup)
            endColumnGroup.userData.columnIndex++
            nextFence.columnGroup.userData.columnIndex =
              endColumnGroup.userData.columnIndex - 1
            stretchZProgressDataRef.current.fenceIndex++

            if (nextFence.z < maxLength) {
              addVanilla(side)
            }
          }
        }
      }

      // subtractive direction to back side
      if (direction === -1) {
        if (fenceIndex > 0) {
          const realDistance = midEndZ + distance
          const lastVisibleFence = fences[fenceIndex]

          if (realDistance < lastVisibleFence.z) {
            handleColumnGroup.position.setZ(
              fences[fenceIndex - 1].z + vanillaLength / 2
            )
            setInvisibleNoRaycast(lastVisibleFence.columnGroup)
            stretchZProgressDataRef.current.fenceIndex--
            lastVisibleFence.columnGroup.userData.columnIndex = -1
            endColumnGroup.userData.columnIndex--
          }
        }
      }
    }

    // front side
    if (side === -1) {
      // const cl = clamp(lo, hi)
      // additive direction to front side
      if (direction === -1) {
        if (fenceIndex + 1 < fences.length) {
          const nextFence = fences[fenceIndex + 1]

          const realDistance = midStartZ + distance
          if (realDistance <= nextFence.z) {
            handleColumnGroup.position.setZ(
              nextFence.z - handleColumnGroup.userData.length
            )
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
              addVanilla(side)
            }
          }
        }
      }

      // subtractive direction to front side
      if (direction === 1) {
        if (fenceIndex > 0) {
          const realDistance = midStartZ + distance
          const lastVisibleFence = fences[fenceIndex]

          if (realDistance > lastVisibleFence.z) {
            setInvisibleNoRaycast(lastVisibleFence.columnGroup)

            handleColumnGroup.position.setZ(
              lastVisibleFence.z + vanillaLength / 2
            )

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
  }

  const last = () => {
    if (!stretchZInitialDataRef.current) return

    const { layoutGroup, side, houseTransformsGroup } =
      stretchZInitialDataRef.current

    const sortedVisibleColumnGroups = pipe(
      layoutGroup,
      getSortedVisibleColumnGroups
    )

    const columnGroupCount = sortedVisibleColumnGroups.length

    if (side === 1) {
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

    if (side === -1) {
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

    layoutGroup.userData.updateLength()
    layoutGroup.userData.updateActiveColumnGroupCount(columnGroupCount)
    houseTransformsGroup.userData.updateXStretchHandleLengths()
    houseTransformsGroup.userData.setXStretchHandlesVisible(true)
    layoutGroup.userData.updateDnas().then(() => {
      houseTransformsGroup.userData.refreshAltSectionTypeLayouts()
    })

    stretchZInitialDataRef.current = null
    stretchZProgressDataRef.current = {
      lastDistance: 0,
      fences: [],
      fenceIndex: 0,
    }
  }

  return { first, mid, last }
}

export default useOnDragStretchZ
