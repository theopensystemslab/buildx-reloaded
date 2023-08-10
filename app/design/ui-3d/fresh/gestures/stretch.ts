import { ThreeEvent } from "@react-three/fiber"
import { Handler } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { Group, Object3D, Vector3 } from "three"
import { VanillaColumn } from "../../../../db/layouts"
import { A, Num, O, Ord, T } from "../../../../utils/functions"
import { setCameraControlsEnabled } from "../../../state/camera"
import pointer from "../../../state/pointer"
import { createColumnGroup } from "../helpers/layouts"
import {
  getActiveHouseUserData,
  getActiveLayoutGroup,
  getHouseTransformsGroupUp,
  getLayoutGroupColumnGroups,
  handleColumnGroupParentQuery,
} from "../helpers/sceneQueries"
import {
  decrementColumnCount,
  incrementColumnCount,
  StretchHandleMeshUserData,
} from "../userData"
import { dispatchPointerDown, dispatchPointerUp } from "./events"

type StretchData = StretchZUpData | StretchZDownData

type StretchZDataShared = {
  systemId: string
  houseId: string
  axis: "z" | "x"
  handleObject: Object3D
  houseTransformsGroup: Object3D
  handleGroup: Object3D
  layoutGroup: Object3D
  point0: Vector3
  handleGroupPos0: Vector3
  lastDistance: number
  vanillaColumn: VanillaColumn
  vanillaColumnGroup: Object3D
  columnsAdded: number
  vanillaColumnsAdded: Object3D[]
}

type StretchZUpData = {
  direction: 1
  penultimateColumnGroup: Object3D
  endColumnGroup: Object3D
} & StretchZDataShared

type StretchZDownData = {
  direction: -1
  startColumnGroup: Object3D
  secondColumnGroup: Object3D
} & StretchZDataShared

const useOnDragStretch = () => {
  const stretchDataRef = useRef<StretchData | null>(null)

  const onStretchXProgress: Handler<"drag", ThreeEvent<PointerEvent>> = () => {}

  const onStretchZProgress: Handler<"drag", ThreeEvent<PointerEvent>> = () => {
    const stretchData = stretchDataRef.current!

    switch (stretchData.direction) {
      case -1: {
        return
      }
      case 1: {
        const {
          handleGroup,
          handleGroupPos0,
          point0,
          houseTransformsGroup,
          layoutGroup,
          lastDistance,
          columnsAdded,
          vanillaColumn,
          vanillaColumnGroup,
          penultimateColumnGroup,
          endColumnGroup,
        } = stretchData as StretchZUpData

        const [x1, z1] = pointer.xz
        const distanceVector = new Vector3(x1, 0, z1).sub(point0)
        distanceVector.applyAxisAngle(
          new Vector3(0, 1, 0),
          -houseTransformsGroup.rotation.y
        )
        const distance = distanceVector.z

        handleGroup.position.set(0, 0, handleGroupPos0.z + distance)

        switch (true) {
          // this part works
          case distance > lastDistance: {
            if (distance > vanillaColumn.length * columnsAdded) {
              const newColumnGroup = vanillaColumnGroup.clone()

              newColumnGroup.position.setZ(
                penultimateColumnGroup.position.z +
                  penultimateColumnGroup.userData.length / 2 +
                  columnsAdded * vanillaColumn.length +
                  vanillaColumn.length / 2
              )

              layoutGroup.add(newColumnGroup)

              newColumnGroup.userData.columnIndex =
                penultimateColumnGroup.userData.columnIndex + 1

              endColumnGroup.userData.columnIndex++

              incrementColumnCount(layoutGroup)

              stretchData.columnsAdded++
              stretchData.vanillaColumnsAdded.push(newColumnGroup)
            }
            break
          }
          // this part doesn't work
          case distance < lastDistance: {
            if (distance < vanillaColumn.length * (columnsAdded - 1)) {
              pipe(
                stretchData.vanillaColumnsAdded,
                A.last,
                O.map((x) => {
                  x.removeFromParent()
                  stretchData.columnsAdded--
                  decrementColumnCount(layoutGroup)
                  endColumnGroup.userData.columnIndex--
                  stretchData.vanillaColumnsAdded.pop()
                })
              )
            }
            break
          }
        }

        stretchData.lastDistance = distance

        return
      }
    }
  }

  const onDragStretch: Handler<"drag", ThreeEvent<PointerEvent>> = (state) => {
    const {
      first,
      last,
      event,
      event: { object, point },
    } = state

    switch (true) {
      case first: {
        setCameraControlsEnabled(false)
        dispatchPointerDown({ point, object })

        const { direction, axis } = object.userData as StretchHandleMeshUserData

        const handleGroup = handleColumnGroupParentQuery(object)
        const houseTransformsGroup = getHouseTransformsGroupUp(object)
        const { systemId, houseId, vanillaColumn, columnCount } =
          getActiveHouseUserData(houseTransformsGroup)
        const layoutGroup = getActiveLayoutGroup(houseTransformsGroup)

        switch (axis) {
          case "x": {
            return
          }
          case "z":
            {
              switch (direction) {
                case 1: {
                  const [penultimateColumnGroup, endColumnGroup] = pipe(
                    layoutGroup,
                    getLayoutGroupColumnGroups,
                    A.filter((x) => x.userData.columnIndex >= columnCount - 2),
                    A.sort(
                      pipe(
                        Num.Ord,
                        Ord.contramap((x: Object3D) => x.userData.columnIndex)
                      )
                    )
                  )

                  const zUpTask = pipe(
                    T.of(vanillaColumn),
                    T.chain(({ gridGroups }) =>
                      pipe(
                        createColumnGroup({
                          systemId,
                          houseId,
                          gridGroups,
                          columnIndex: -1,
                        }),
                        T.map((vanillaColumnGroup) => {
                          const foo: StretchZUpData = {
                            systemId,
                            houseId,
                            handleObject: object,
                            houseTransformsGroup: houseTransformsGroup,
                            handleGroup,
                            handleGroupPos0: handleGroup.position.clone(),
                            point0: point,
                            lastDistance: 0,
                            direction,
                            axis,
                            columnsAdded: 0,
                            vanillaColumn,
                            endColumnGroup,
                            penultimateColumnGroup,
                            layoutGroup,
                            vanillaColumnGroup,
                            vanillaColumnsAdded: [],
                          }
                          stretchDataRef.current = foo
                        })
                      )
                    )
                  )

                  zUpTask()

                  break
                }
                case -1:
                  const [startColumnGroup, secondColumnGroup] = pipe(
                    layoutGroup,
                    getLayoutGroupColumnGroups,
                    A.filter((x) => x.userData.columnIndex <= 1),
                    A.sort(
                      pipe(
                        Num.Ord,
                        Ord.contramap((x: Object3D) => x.userData.columnIndex)
                      )
                    )
                  )

                  const zDownTask = pipe(
                    T.of(vanillaColumn),
                    T.chain(({ gridGroups }) =>
                      pipe(
                        createColumnGroup({
                          systemId,
                          houseId,
                          gridGroups,
                          columnIndex: -1,
                        }),
                        T.map((vanillaColumnGroup) => {
                          stretchDataRef.current = {
                            systemId,
                            houseId,
                            handleObject: object,
                            houseTransformsGroup: houseTransformsGroup,
                            handleGroup,
                            handleGroupPos0: handleGroup.position.clone(),
                            point0: point,
                            lastDistance: 0,
                            direction,
                            axis,
                            columnsAdded: 0,
                            vanillaColumn,
                            layoutGroup,
                            startColumnGroup,
                            secondColumnGroup,
                            vanillaColumnGroup,
                            vanillaColumnsAdded: [],
                          } as StretchZDownData
                        })
                      )
                    )
                  )

                  zDownTask()

                  break
              }
            }

            return
        }
      }
      case last: {
        if (stretchDataRef.current === null)
          throw new Error("stretchData.current null unexpectedly")
        dispatchPointerUp()
        stretchDataRef.current = null
        setCameraControlsEnabled(true)
        return
      }
      default: {
        if (!stretchDataRef.current)
          throw new Error(`onDragStretch first didn't set first`)

        const { axis } = stretchDataRef.current

        switch (axis) {
          case "z":
            onStretchZProgress(state)
            return
          case "x":
            onStretchXProgress(state)
            return
        }
      }
    }
  }

  return onDragStretch
}

export default useOnDragStretch
