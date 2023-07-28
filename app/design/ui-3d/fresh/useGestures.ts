import { invalidate, ThreeEvent } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { pipe } from "fp-ts/lib/function"
import { A, O } from "../../../utils/functions"
import { isMesh } from "../../../utils/three"
import { openMenu } from "../../state/menu"
import scope, { ScopeItem } from "../../state/scope"
import siteCtx, { downMode, SiteCtxModeEnum } from "../../state/siteCtx"
import { dispatchOutline } from "./events/outlines"
import { UserData, UserDataTypeEnum } from "./userData"

const useGestures = () => {
  return useGesture<{
    drag: ThreeEvent<PointerEvent>
    hover: ThreeEvent<PointerEvent>
    onContextMenu: ThreeEvent<PointerEvent> &
      React.MouseEvent<EventTarget, MouseEvent>
    onDoubleClick: ThreeEvent<PointerEvent> &
      React.MouseEvent<EventTarget, MouseEvent>
  }>({
    onHover: ({ event, event: { intersections }, hovering }) => {
      console.log("HELLO?")
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
        eventObject,
        // object: { userData },
      } = intersections[0]

      // if (object.parent?.parent) {
      //   const objects = object.parent.parent.children.flatMap((x) => x.children)
      //   dispatchOutline({
      //     objects,
      //   })
      // }

      switch (siteCtx.mode) {
        case SiteCtxModeEnum.Enum.SITE:
          console.log("yo")
          if (object.parent?.parent?.parent?.parent) {
            console.log("sup")
            const objects = object.parent.parent.parent.parent.children.flatMap(
              (x) =>
                x.children.flatMap((y) => y.children.flatMap((z) => z.children))
            )
            dispatchOutline({
              objects,
            })
          }
          break
        case SiteCtxModeEnum.Enum.BUILDING:
          // OUTLINE COLUMN ?!
          break
        case SiteCtxModeEnum.Enum.LEVEL:
          if (object.parent) {
            dispatchOutline({ objects: object.parent.children })
          }
          break
      }

      // scope.hovered = {
      //   ...userData.identifier,
      // }

      if (hovering) {
        document.body.style.cursor = "grab"
      }

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

      const { object } = intersections[0]

      const userData: UserData = object.userData as UserData

      switch (userData.type) {
        case UserDataTypeEnum.Enum.ElementMesh:
          const houseId =
            object.parent?.parent?.parent?.parent?.userData.houseId
          const levelIndex = object.parent?.parent?.userData.levelIndex
          if (houseId && levelIndex) downMode({ houseId, levelIndex })
      }

      // if (userData) {
      //   if (userData?.identifier?.houseId) {
      //     downMode({ ...userData.identifier })
      //   }
      // }

      invalidate()
    },
  }) as any
}

export default useGestures
