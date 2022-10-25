// import siteContext, {
//   EditModeEnum,
//   enterBuildingMode,
//   enterLevelMode,
//   SiteContextModeEnum,
//   useSiteContextMode,
// } from "@/stores/context"
// import highlights from "@/stores/highlights"
// import { useMaterial, useMaterialName } from "@/stores/materials"
// import menu, { openMenu } from "@/stores/menu"
// import scope from "@/stores/scope"
// import { all, objComp, object3dChildOf } from "@/utils"
import { useBVH } from "@react-three/drei"
import {
  Intersection,
  invalidate,
  MeshProps,
  ThreeEvent,
} from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import React, { useEffect, useRef } from "react"
import { BufferGeometry, Mesh, Object3D, Plane } from "three"
import { ref } from "valtio"
import { subscribeKey } from "valtio/utils"

type Props = MeshProps & {
  systemId: string
  elementName: string
  columnIndex: number
  levelIndex: number
  groupIndex: number
  buildingId: string
  geometry: BufferGeometry
  clippingPlanes: Plane[]
}

const GltfElement = (props: Props) => {
  return null
  // const {
  //   systemId,
  //   geometry,
  //   elementName,
  //   columnIndex,
  //   levelIndex,
  //   groupIndex,
  //   buildingId,
  //   clippingPlanes,
  // } = props

  // const meshRef = useRef<Mesh>()

  // const materialName = useMaterialName(systemId, buildingId, elementName)

  // const material = useMaterial(
  //   {
  //     buildingId,
  //     columnIndex,
  //     levelIndex,
  //     groupIndex,
  //     elementName,
  //     materialName,
  //   },
  //   clippingPlanes
  // )

  // const contextMode = useSiteContextMode()

  // const key = {
  //   elementName,
  //   groupIndex,
  //   levelIndex,
  //   columnIndex,
  //   buildingId,
  // }

  // const checks = (intersections: Intersection[]): boolean => {
  //   if (menu.open) return false
  //   if (!meshRef.current) return false

  //   const ixs =
  //     siteContext.levelIndex !== null && clippingPlanes.length > 0
  //       ? intersections.filter((ix) =>
  //           clippingPlanes.every((elem2) => elem2.distanceToPoint(ix.point) > 0)
  //         )
  //       : intersections

  //   if (!ixs?.[0]) return false

  //   const obj = ixs?.[0].object ?? ixs?.[0].eventObject

  //   if (
  //     !obj ||
  //     obj.id !== meshRef.current?.id ||
  //     !object3dChildOf(obj, meshRef.current)
  //   )
  //     return false

  //   if (
  //     (siteContext.buildingId !== null &&
  //       siteContext.buildingId !== buildingId) ||
  //     (siteContext.levelIndex !== null && siteContext.levelIndex !== levelIndex)
  //   )
  //     return false

  //   return true
  // }

  // const bind = useGesture<{
  //   hover: ThreeEvent<PointerEvent>
  //   onPointerDown: ThreeEvent<PointerEvent>
  //   onContextMenu: ThreeEvent<PointerEvent> &
  //     React.MouseEvent<EventTarget, MouseEvent>
  //   onClick: ThreeEvent<PointerEvent> &
  //     React.MouseEvent<EventTarget, MouseEvent>
  //   onDoubleClick: ThreeEvent<PointerEvent> &
  //     React.MouseEvent<EventTarget, MouseEvent>
  // }>({
  //   onHover: ({ event: { intersections } }) => {
  //     if (!checks(intersections)) return
  //     if (scope.hovered === null || !objComp(scope.hovered, key)) {
  //       scope.hovered = key
  //     }
  //     invalidate()
  //   },
  //   onContextMenu: ({ event, event: { intersections, pageX, pageY } }: any) => {
  //     event.preventDefault?.()
  //     if (!checks(intersections)) return
  //     openMenu(pageX, pageY)
  //     invalidate()
  //   },
  //   onPointerDown: ({ event: { intersections } }) => {
  //     if (!checks(intersections)) return
  //     scope.selected = key
  //     invalidate()
  //   },
  //   onDoubleClick: ({ event, event: { intersections, pageX, pageY } }) => {
  //     event.preventDefault?.()
  //     if (!checks(intersections)) return

  //     if (siteContext.buildingId === null) {
  //       enterBuildingMode(buildingId)
  //     } else {
  //       enterLevelMode(levelIndex)
  //     }
  //     invalidate()
  //   },
  //   onClick: ({ event, event: { intersections, pageX, pageY } }) => {
  //     event.preventDefault?.()
  //     if (
  //       siteContext.buildingId !== null ||
  //       siteContext.editMode === EditModeEnum.Enum.MOVE_ROTATE
  //     )
  //       return
  //     if (!checks(intersections)) return
  //     siteContext.editMode = EditModeEnum.Enum.MOVE_ROTATE
  //   },
  // })

  // const selectOrHoverHandler = () => {
  //   if (contextMode !== SiteContextModeEnum.Enum.BUILDING) return

  //   const isOutlined =
  //     highlights.outlined.filter(
  //       (x) => meshRef.current && x.id === meshRef.current.id
  //     ).length > 0

  //   const isHovered =
  //     buildingId === scope.hovered?.buildingId &&
  //     elementName === scope.hovered?.elementName

  //   const isSelected =
  //     scope.selected?.buildingId === buildingId &&
  //     scope.selected?.elementName === elementName

  //   if ((isHovered || isSelected) && !isOutlined) {
  //     highlights.outlined.push(ref(meshRef.current as Object3D))
  //   }
  //   if (
  //     all(!menu.open, isOutlined, !isHovered, !isSelected, !!meshRef.current)
  //   ) {
  //     highlights.outlined = highlights.outlined.filter(
  //       (x) => x.id !== meshRef.current!.id
  //     )
  //   }
  // }

  // useEffect(() => subscribeKey(scope, "hovered", selectOrHoverHandler))
  // useEffect(() => subscribeKey(scope, "selected", selectOrHoverHandler))

  // useBVH(meshRef)

  // return (
  //   <mesh
  //     ref={meshRef}
  //     geometry={geometry}
  //     material={material}
  //     castShadow
  //     {...(bind() as any)}
  //   />
  // )
}

export default GltfElement
