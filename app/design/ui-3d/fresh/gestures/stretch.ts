import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Object3D, Vector3 } from "three"
import { A, O, T } from "../../../../utils/functions"
import { setInvisibleNoRaycast } from "../../../../utils/three"
import { splitColumns } from "../../../../workers/layouts/worker"
import pointer from "../../../state/pointer"
import { recomputeLayoutGroup } from "../dimensions"
import {
  columnSorter,
  createColumnGroup,
  splitColumnGroups,
  vanillaColumns,
} from "../helpers/layouts"
import {
  getActiveHouseUserData,
  getActiveLayoutGroup,
  getHouseTransformsGroupUp,
  getLayoutGroupColumnGroups,
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
    endColumnGroup: Object3D
    templateVanillaColumnGroup: Object3D
    vanillaLength: number
  } | null>(null)

  type Fence = {
    z: number
    columnGroup: Object3D
  }

  const stretchZProgressDataRef = useRef<{
    vanillaFences: Fence[]
    lastDistance: number
  }>({
    vanillaFences: [],
    lastDistance: 0,
  })

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
      const columnGroups = pipe(
        layoutGroup,
        getLayoutGroupColumnGroups,
        columnSorter
      )

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

              stretchZInitialDataRef.current = {
                direction,
                handleGroup,
                layoutGroup,
                houseTransformsGroup,
                point0: point,
                handleGroupZ0: handleGroup.position.z,
                templateVanillaColumnGroup,
                vanillaLength: templateVanillaColumnGroup.userData.length,
                columnGroups,
                startColumnGroup,
                midColumnGroups,
                endColumnGroup,
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
      } = stretchZInitialDataRef.current

      const { lastDistance, vanillaFences } = stretchZProgressDataRef.current

      const [x1, z1] = pointer.xz
      const distanceVector = new Vector3(x1, 0, z1).sub(point0)
      distanceVector.applyAxisAngle(
        new Vector3(0, 1, 0),
        -houseTransformsGroup.rotation.y
      )
      const distance = distanceVector.z * direction
      handleGroup.position.set(0, 0, handleGroupZ0 + distance * direction)

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

            stretchZProgressDataRef.current.vanillaFences.push({
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
          const foo = pipe(
            vanillaFences,
            A.last,
            O.map(({ z, columnGroup }) => {
              if (distance < z) {
                columnGroup.removeFromParent()
                vanillaFences.pop()
                // vanillaFences.pop()
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

      stretchZProgressDataRef.current.lastDistance = distance
    },
    last: () => {
      stretchZInitialDataRef.current = null
      stretchZProgressDataRef.current = {
        lastDistance: 0,
        vanillaFences: [],
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
