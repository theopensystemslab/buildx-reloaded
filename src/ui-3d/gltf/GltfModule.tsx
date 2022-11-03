// import { BareModule, LoadedModule } from "@/data/module"
// import { setCameraEnabled } from "@/stores/camera"
// import siteContext, {
//   SiteContextModeEnum,
//   useSiteContext,
//   useSiteContextMode,
// } from "@/stores/context"
// import { useModuleGeometries } from "@/stores/geometries"
// import { outlineGroup } from "@/stores/highlights"
// import houses from "@/stores/houses"
// import menu from "@/stores/menu"
// import pointer from "@/stores/pointer"
// import scope from "@/stores/scope"
// import swap from "@/stores/swap"
// import { reduceWithIndexM, StrOrd } from "@/utils"
import { GroupProps } from "@react-three/fiber"
import { useRef } from "react"
import { Group, Plane, Vector3 } from "three"
import { Module } from "../../data/modules"
// import { getSibling } from "../../../stores/swap"

type Props = GroupProps & {
  module: Module
  columnIndex: number
  levelIndex: number
  groupIndex: number
  houseId: string
  levelY: number
  verticalCutPlanes: Plane[]
  // columnZ: number
}

const GltfModule = (props: Props) => {
  const {
    houseId,
    columnIndex,
    levelIndex,
    groupIndex,
    module,
    levelY,
    verticalCutPlanes,
    // columnZ,
    ...groupProps
  } = props

  const { position } = groupProps

  // so these positions are relative to the column
  const [groupPosX0, groupPosZ0] =
    position instanceof Vector3
      ? [position.x, position.z]
      : typeof position === "object"
      ? [position[0], position[2]]
      : [0, 0]

  const groupRef = useRef<Group>(null)

  // const moduleGeometries = useModuleElementGeometries(
  //   module.systemId,
  //   module.dna
  //   // module.gltf
  // )

  // const context = useSiteContext()

  // const levelCutPlane: Plane = useMemo(
  //   () => new Plane(new Vector3(0, -1, 0), levelY + module.height / 2),
  //   []
  // )

  const children = null
  // const children = pipe(
  //   moduleGeometries,
  //   RM.reduceWithIndexM(StrOrd)(
  //     [],
  //     (elementName, acc: JSX.Element[], geometry) => [
  //       ...acc,
  //       <GltfElement
  //         key={JSON.stringify({
  //           buildingId,
  //           columnIndex,
  //           levelIndex,
  //           groupIndex,
  //           dna: module.dna,
  //           elementName,
  //         })}
  //         {...{
  //           elementName,
  //           geometry,
  //           systemId: module.systemId,
  //           buildingId,
  //           columnIndex,
  //           levelIndex,
  //           groupIndex,
  //           clippingPlanes: [
  //             verticalCutPlanes,
  //             context.levelIndex === levelIndex ? [levelCutPlane] : [],
  //           ].flat(),
  //         }}
  //       />,
  //     ]
  //   )
  // )

  // const contextMode = useSiteContextMode()

  // useEffect(() => {
  //   if (contextMode === SiteContextModeEnum.Enum.LEVEL) {
  //     return subscribeKey(scope, "hovered", () => {
  //       if (
  //         !menu.open &&
  //         scope.hovered?.columnIndex === columnIndex &&
  //         context.levelIndex === levelIndex &&
  //         groupIndex === scope.hovered?.groupIndex
  //       ) {
  //         outlineGroup(groupRef)
  //       } else {
  //         outlineGroup(groupRef, { remove: true })
  //       }
  //     })
  //   }
  // }, [contextMode])

  // const isSelectedCheck = (): boolean =>
  //   scope.selected?.buildingId === buildingId &&
  //   scope.selected?.columnIndex === columnIndex &&
  //   scope.selected?.levelIndex === levelIndex &&
  //   scope.selected?.groupIndex === groupIndex

  // const isDragResponsive = (): boolean =>
  //   buildingId === siteContext.buildingId && // the right building
  //   levelIndex === siteContext.levelIndex && // the right level
  //   module.structuredDna.positionType !== "END" && // not an end
  //   !isSelectedCheck() // not selected

  // const rotateVector = useRotateVector(buildingId)

  // const shifted = useRef<"DOWN" | "UP" | null>(null)

  // useEffect(() => {
  //   return subscribe(swap, () => {
  //     if (!groupRef.current) return
  //     if (!isDragResponsive()) return

  //     const { dragModulePing } = swap

  //     if (dragModulePing === null) {
  //       groupRef.current.position.x = groupPosX0
  //       groupRef.current.position.z = groupPosZ0
  //       return
  //     }

  //     const thisLow = columnZ + groupPosZ0,
  //       thisHigh = thisLow + module.length,
  //       current =
  //         dragModulePing.z0 + dragModulePing.length / 2 + dragModulePing.dpz,
  //       isHigherModule = thisLow > dragModulePing.z0,
  //       isLowerModule = !isHigherModule,
  //       dragThreshold = Math.min(dragModulePing.length, module.length)

  //     const down =
  //       isHigherModule &&
  //       shifted.current === null &&
  //       current + dragThreshold > thisHigh

  //     const downToNull =
  //       isHigherModule &&
  //       shifted.current === "DOWN" &&
  //       current + dragThreshold <= thisHigh

  //     const up =
  //       isLowerModule &&
  //       shifted.current === null &&
  //       current - dragThreshold < thisLow

  //     const upToNull =
  //       isLowerModule &&
  //       shifted.current === "UP" &&
  //       current - dragThreshold >= thisLow

  //     switch (true) {
  //       // needs shifting down
  //       case down:
  //         shifted.current = "DOWN"
  //         groupRef.current.position.z = groupPosZ0 - dragModulePing.length
  //         swap.dragModulePong = {
  //           columnIndex,
  //           levelIndex,
  //           groupIndex,
  //         }
  //         break

  //       // down needs shifting back up
  //       case downToNull: {
  //         shifted.current = null
  //         groupRef.current.position.z = groupPosZ0
  //         const sibling = getSibling(
  //           { columnIndex, levelIndex, groupIndex },
  //           -1
  //         )
  //         swap.dragModulePong = sibling
  //         break
  //       }

  //       // needs shifting up
  //       case up:
  //         shifted.current = "UP"
  //         groupRef.current.position.z = groupPosZ0 + dragModulePing.length
  //         swap.dragModulePong = {
  //           columnIndex,
  //           levelIndex,
  //           groupIndex,
  //         }
  //         break

  //       case upToNull: {
  //         shifted.current = null
  //         groupRef.current.position.z = groupPosZ0
  //         const sibling = getSibling({ columnIndex, levelIndex, groupIndex }, 1)
  //         swap.dragModulePong = sibling
  //         break
  //       }
  //     }
  //   })
  // }, [])

  // const pointerXZ0 = useRef([0, 0])

  // const canDragCheck = (): boolean =>
  //   module.structuredDna.positionType !== "END" &&
  //   buildingId === siteContext.buildingId &&
  //   levelIndex === siteContext.levelIndex

  // const bind = useDrag(({ first, last }) => {
  //   if (first) setCameraEnabled(false)
  //   if (last) setCameraEnabled(true)
  //   if (!canDragCheck() || !groupRef.current) return

  //   const [px, pz] = pointer.xz

  //   if (first) {
  //     pointerXZ0.current = [px, pz]
  //   }

  //   const [, initZ] = pointerXZ0.current
  //   const [dpx, dpz] = rotateVector([0, pz - initZ])

  //   if (isSelectedCheck()) {
  //     groupRef.current.position.x = groupPosX0 + dpx
  //     groupRef.current.position.z = groupPosZ0 + dpz

  //     swap.dragModulePing = {
  //       dpz: dpz,
  //       z0: columnZ + groupPosZ0,
  //       length: module.length,
  //     }
  //   }

  //   if (last && isSelectedCheck()) {
  //     if (swap.dragModulePong === null || swap.activeBuildingMatrix === null)
  //       return

  //     const {
  //       columnIndex: c,
  //       levelIndex: l,
  //       groupIndex: g,
  //     } = swap.dragModulePong

  //     const noChange = c === columnIndex && l === levelIndex && g === groupIndex

  //     if (noChange) return

  //     houses[buildingId].dna = pipe(
  //       swap.activeBuildingMatrix,
  //       produce<BareModule[][][]>((draft) => {
  //         const tmp = { ...draft[columnIndex][levelIndex][groupIndex] }
  //         draft[columnIndex][levelIndex][groupIndex] = { ...draft[c][l][g] }
  //         draft[c][l][g] = { ...tmp }
  //       }),
  //       (x) => {
  //         swap.activeBuildingMatrix = x
  //         return x
  //       },
  //       columnMatrixToDna
  //     )

  //     // reset
  //     groupRef.current.position.x = groupPosX0
  //     groupRef.current.position.z = groupPosZ0
  //     swap.dragModulePing = null
  //   }

  //   invalidate()
  // })

  return (
    <group
      ref={groupRef}
      {...groupProps}
      // {...(bind() as any)}
    >
      {children}
    </group>
  )
}

export default GltfModule
