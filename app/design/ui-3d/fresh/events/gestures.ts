import { invalidate, ThreeEvent } from "@react-three/fiber"
import { Handler, useGesture, UserHandlers } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { RefObject, useRef } from "react"
import { useEvent } from "react-use"
import { Group, Object3D, Vector3 } from "three"
import { z } from "zod"
import { A, O } from "../../../../utils/functions"
import { isMesh } from "../../../../utils/three"
import { setCameraControlsEnabled } from "../../../state/camera"
import { openMenu } from "../../../state/menu"
import pointer from "../../../state/pointer"
import scope, { ScopeItem } from "../../../state/scope"
import siteCtx, { downMode, SiteCtxModeEnum } from "../../../state/siteCtx"
import {
  getActiveHouseUserData,
  getHouseGroupColumns,
  handleColumnGroupParentQuery,
  rootHouseGroupParentQuery,
} from "../helpers/sceneQueries"
import { insertVanillaColumn } from "../helpers/stretchZ"
import {
  elementMeshToScopeItem,
  GridGroupUserData,
  HouseTransformsGroupUserData,
  StretchHandleMeshUserData,
  UserDataTypeEnum,
} from "../userData"
import { dispatchOutline } from "./outlines"

export const GestureEventType = z.enum(["POINTER_DOWN", "POINTER_UP"])

export type GestureEventType = z.infer<typeof GestureEventType>

export type GestureEventDetail = {
  point: V3
  object: Object3D
}

export const usePointerDownListener = (
  f: (eventDetail: GestureEventDetail) => void
) => useEvent(GestureEventType.Enum.POINTER_DOWN, ({ detail }) => f(detail))

export const dispatchPointerDown = (detail: GestureEventDetail) =>
  dispatchEvent(new CustomEvent(GestureEventType.Enum.POINTER_DOWN, { detail }))

export const usePointerUpListener = (f: () => void) =>
  useEvent(GestureEventType.Enum.POINTER_UP, () => f())

export const dispatchPointerUp = () =>
  dispatchEvent(new CustomEvent(GestureEventType.Enum.POINTER_UP))

const objectToHouseObjects = (object: Object3D) =>
  object.parent!.parent!.parent!.parent!.children.flatMap((x) =>
    x.children.flatMap((y) => y.children.flatMap((z) => z.children))
  )

const objectToIfcTagObjects = (object: Object3D) => {
  const ifcTag: string = object.userData.ifcTag

  return object.parent!.parent!.parent!.parent!.children.flatMap((x) =>
    x.children.flatMap((y) =>
      y.children.flatMap((z) =>
        z.children.filter((x) => x.userData.ifcTag === ifcTag)
      )
    )
  )
}

const useGestures = (rootRef: RefObject<Group>) => {
  // const firstGestureDataRef = useRef<{
  //   gestureTarget: Object3D
  //   gestureTargetHouseGroup: Group
  //   point: Vector3
  // } | null>(null)

  // const stretchDragGroup = useRef<Group | null>(null)

  const stretchData = useRef<{
    handleObject: Object3D
    houseGroup: Group
    handleGroup: Group
    point0: Vector3
    handleGroupPos0: Vector3
    lastDistance: number
    columnsAddedToEnd: number
  } | null>(null)

  // we could pre-process each gate

  const onDragStretch: Handler<"drag", ThreeEvent<PointerEvent>> = async ({
    first,
    last,
    event,
    event: { object, point },
  }) => {
    switch (true) {
      case first: {
        setCameraControlsEnabled(false)
        const handleGroup = handleColumnGroupParentQuery(object)
        const houseGroup = rootHouseGroupParentQuery(object)
        stretchData.current = {
          handleObject: object,
          houseGroup,
          handleGroup,
          handleGroupPos0: handleGroup.position.clone(),
          point0: point,
          lastDistance: 0,
          columnsAddedToEnd: 0,
        }
        dispatchPointerDown({ point, object })
        break
      }
      case !first && !last: {
        if (!stretchData.current) throw new Error("first didn't set first")

        const {
          handleGroup,
          handleGroupPos0,
          point0,
          houseGroup,
          handleObject,
          lastDistance,
          columnsAddedToEnd,
        } = stretchData.current

        const { vanillaColumn } = getActiveHouseUserData(houseGroup)

        const { direction, axis } =
          handleObject.userData as StretchHandleMeshUserData

        switch (axis) {
          case "z":
            switch (direction) {
              case 1: {
                const [x1, z1] = pointer.xz
                const distanceVector = new Vector3(x1, 0, z1).sub(point0)
                distanceVector.applyAxisAngle(
                  new Vector3(0, 1, 0),
                  -houseGroup.rotation.y
                )
                const distance = distanceVector.z

                handleGroup.position.set(0, 0, handleGroupPos0.z + distance)

                // maybe we want to oper on the house group columns doodah itself

                // and then constantly be computing whether we want to add or subtract

                // so we're tracking the next gate up or down

                // probably want to just set visible false and turn off raycasting
                // when we delete columns

                // let's work on adding some first

                // gate 1 = z'end + vanillaColumnLength

                switch (true) {
                  case distance > lastDistance: {
                    if (distance > vanillaColumn.length * columnsAddedToEnd) {
                      insertVanillaColumn(houseGroup, 1)()
                      stretchData.current.columnsAddedToEnd++
                    }
                    break
                  }
                  case distance < lastDistance: {
                    if (distance < vanillaColumn.length * columnsAddedToEnd) {
                      console.log("going down")
                    }
                    // if (
                    //   distance <
                    //   vanillaColumnLength * columnsDelta + vanillaColumnLength
                    // ) {
                    //   stretchData.current.columnsDelta++
                    // }
                  }
                }
                stretchData.current.lastDistance = distance

                // gates on err...

                // vanilla column length up

                // existing column length down
              }
            }
        }

        break
      }
      case last: {
        if (stretchData.current === null)
          throw new Error("stretchData.current null unexpectedly")
        dispatchPointerUp()
        stretchData.current = null
        setCameraControlsEnabled(true)
        break
      }
    }
  }

  return useGesture<{
    drag: ThreeEvent<PointerEvent>
    hover: ThreeEvent<PointerEvent>
    onContextMenu: ThreeEvent<PointerEvent> &
      React.MouseEvent<EventTarget, MouseEvent>
    onDoubleClick: ThreeEvent<PointerEvent> &
      React.MouseEvent<EventTarget, MouseEvent>
    onClick: ThreeEvent<PointerEvent> &
      React.MouseEvent<EventTarget, MouseEvent>
  }>({
    onDrag: (state) => {
      const stretch = true
      switch (true) {
        case stretch: {
          onDragStretch(state)
          break
        }
      }

      invalidate()
    },
    onHover: ({ event, event: { intersections }, hovering }) => {
      event.stopPropagation()

      if (intersections.length === 0) {
        document.body.style.cursor = ""
        dispatchOutline({
          objects: [],
        })
        invalidate()
        // scope.hovered = null
        return
      }

      const {
        object,
        // object: { userData },
      } = intersections[0]

      // if (object.parent?.parent) {
      //   const objects = object.parent.parent.children.flatMap((x) => x.children)
      //   dispatchOutline({
      //     objects,
      //   })
      // }

      if (hovering) {
        document.body.style.cursor = "grab"
      }

      if (object.userData.type !== UserDataTypeEnum.Enum.ElementMesh) return
      const scopeItem = elementMeshToScopeItem(object)
      scope.hovered = scopeItem
      switch (siteCtx.mode) {
        case SiteCtxModeEnum.Enum.SITE:
          dispatchOutline({
            objects: objectToHouseObjects(object),
          })
          break
        case SiteCtxModeEnum.Enum.BUILDING:
          dispatchOutline({
            objects: objectToIfcTagObjects(object),
          })
          // object to all of ifc tag
          break
        case SiteCtxModeEnum.Enum.LEVEL:
          // object to all of module group
          if (object.parent) {
            dispatchOutline({ objects: object.parent.children })
          }
          break
      }

      // scope.hovered = {
      //   ...userData.identifier,
      // }

      invalidate()
    },
    onContextMenu: ({ event, event: { intersections, pageX, pageY } }) => {
      event.stopPropagation()
      pipe(
        intersections,
        A.findFirst((x) => {
          return (
            isMesh(x.object) &&
            !Array.isArray(x.object.material) &&
            x.object.material.visible
          )
        }),
        O.map(({ object: { userData } }) => {
          scope.selected = userData as ScopeItem
          openMenu(pageX, pageY)
        })
      )
    },
    onDoubleClick: ({ event, event: { intersections } }) => {
      event.stopPropagation()

      if (intersections.length === 0) return

      const {
        object: { parent },
      } = intersections[0]

      if (parent?.parent?.userData.type === UserDataTypeEnum.Enum.GridGroup) {
        const { levelIndex } = parent.parent.userData as GridGroupUserData
        if (
          parent.parent.parent?.parent?.parent?.userData.type ===
          UserDataTypeEnum.Enum.HouseTransformsGroup
        ) {
          const { houseId } = parent.parent.parent?.parent?.parent
            ?.userData as HouseTransformsGroupUserData
          downMode({ houseId, levelIndex })
        }
      }

      invalidate()
    },
  }) as any
}

export default useGestures
