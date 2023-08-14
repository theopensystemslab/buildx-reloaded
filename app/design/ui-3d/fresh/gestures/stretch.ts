import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Object3D, Vector3 } from "three"
import { T } from "../../../../utils/functions"
import pointer from "../../../state/pointer"
import { recomputeLayoutGroup } from "../dimensions"
import { columnSorter, createColumnGroup } from "../helpers/layouts"
import {
  getActiveHouseUserData,
  getActiveLayoutGroup,
  getHouseTransformsGroupUp,
  getLayoutGroupColumnGroups,
  handleColumnGroupParentQuery,
} from "../helpers/sceneQueries"
import {
  incrementColumnCount,
  StretchHandleMesh,
  StretchHandleMeshUserData,
} from "../userData"

const useOnDragStretch = () => {
  const stretchZInitialDataRef = useRef<{
    direction: number
    point0: Vector3
    handleGroup: Object3D
    houseTransformsGroup: Object3D
    layoutGroup: Object3D
    handleGroupZ0: number
    columnGroups: Object3D[]
    templateVanillaColumnGroup: Object3D
    vanillaLength: number
  } | null>(null)

  const stretchZProgressDataRef = useRef<{
    vanillaColumnGroups: Object3D[]
    lastDistance: number
  }>({
    vanillaColumnGroups: [],
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
              stretchZInitialDataRef.current = {
                direction: handleObject.userData.direction,
                handleGroup,
                layoutGroup,
                houseTransformsGroup,
                point0: point,
                handleGroupZ0: handleGroup.position.z,
                templateVanillaColumnGroup,
                vanillaLength: templateVanillaColumnGroup.userData.length,
                columnGroups,
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
        point0,
        houseTransformsGroup,
        handleGroup,
        handleGroupZ0,
        vanillaLength,
        templateVanillaColumnGroup,
        columnGroups,
        layoutGroup,
      } = stretchZInitialDataRef.current

      const { lastDistance, vanillaColumnGroups } =
        stretchZProgressDataRef.current

      const [x1, z1] = pointer.xz
      const distanceVector = new Vector3(x1, 0, z1).sub(point0)
      distanceVector.applyAxisAngle(
        new Vector3(0, 1, 0),
        -houseTransformsGroup.rotation.y
      )
      const distance = distanceVector.z
      handleGroup.position.set(0, 0, handleGroupZ0 + distance)

      // direction dependent
      switch (true) {
        // addy
        case distance > lastDistance: {
          if (distance > vanillaLength * vanillaColumnGroups.length) {
            const newColumnGroup = templateVanillaColumnGroup.clone()
            const penultimateColumnGroup = columnGroups[columnGroups.length - 2]
            const endColumnGroup = columnGroups[columnGroups.length - 1]

            newColumnGroup.position.setZ(
              penultimateColumnGroup.position.z +
                penultimateColumnGroup.userData.length / 2 +
                (vanillaColumnGroups.length + 0.5) * vanillaLength
            )

            layoutGroup.add(newColumnGroup)

            newColumnGroup.userData.columnIndex =
              penultimateColumnGroup.userData.columnIndex + 1

            endColumnGroup.userData.columnIndex++

            incrementColumnCount(layoutGroup)

            stretchZProgressDataRef.current.vanillaColumnGroups.push(
              newColumnGroup
            )

            recomputeLayoutGroup(layoutGroup)
          }
        }
        // subby
        case distance < lastDistance: {
          if (distance < vanillaLength * (vanillaColumnGroups.length - 1)) {
          }
        }
      }

      stretchZProgressDataRef.current.lastDistance = distance
    },
    last: () => {
      stretchZInitialDataRef.current = null
      stretchZProgressDataRef.current = {
        lastDistance: 0,
        vanillaColumnGroups: [],
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
