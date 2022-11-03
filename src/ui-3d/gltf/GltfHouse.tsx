import {
  indicesToKey,
  PositionedColumn,
  useColumnLayout,
} from "@/hooks/layouts"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useRef } from "react"
import { Group } from "three"
import { useDimensionsSubscription } from "../../hooks/dimensions"
import {
  useHouseElementGeometries,
  useHouseModuleElementGeometries,
} from "../../hooks/geometries"
import {
  useHouse,
  useHouseEventHandlers,
  useMoveRotateSubscription,
} from "../../hooks/houses"
import siteCtx, {
  EditModeEnum,
  SiteCtxModeEnum,
  useEditMode,
  useSiteCtx,
  useSiteCtxMode,
} from "../../hooks/siteCtx"
import { useRotateVector } from "../../hooks/transforms"
import { useVerticalCutPlanes } from "../../hooks/verticalCutPlanes"
import { RA } from "../../utils/functions"
import RotateHandles from "../RotateHandles"
import StretchHandle from "../StretchHandle"
import VerticalHandle from "../VerticalHandle"
import GltfColumn from "./GltfColumn"
import GltfModule2 from "./GltfModule2"

type Props = {
  id: string
}

const GltfHouse = (props: Props) => {
  const houseGroupRef = useRef<Group>(null!)
  const startHandleRef = useRef<Group>(null!)
  const endHandleRef = useRef<Group>(null!)
  const { id } = props

  // TODO: subscription event arch
  const {
    position: [buildingX, buildingZ],
    rotation,
  } = useHouse(id)

  const columnLayout = useColumnLayout(id)

  useDimensionsSubscription(id, columnLayout)
  useMoveRotateSubscription(id, houseGroupRef)

  const bind = useHouseEventHandlers(id)

  useHouseModuleElementGeometries(id)
  // continue here
  useHouseElementGeometries(id, columnLayout)

  const editMode = useEditMode()
  const siteCtxMode = useSiteCtxMode()

  // const rotateVector = useRotateVector(id)

  // const verticalCutPlanes = useVerticalCutPlanes(columnLayout, id)

  // const {
  //   startColumn,
  //   midColumns,
  //   endColumn,
  //   startClamp,
  //   endClamp,
  //   vanillaPositionedRows,
  //   sendDrag,
  //   sendDrop,
  // } = useStretchLength(buildingId, columnLayout)

  const renderColumn = ({ columnIndex, z, gridGroups }: PositionedColumn) => (
    <GltfColumn
      key={columnIndex}
      houseId={id}
      columnIndex={columnIndex}
      columnZ={z}
      gridGroups={gridGroups}
      mirror={columnIndex === columnLayout.length - 1}
      verticalCutPlanes={[]}
    />
  )

  return (
    <Fragment>
      <group ref={houseGroupRef}>
        <group
          {...(siteCtxMode === SiteCtxModeEnum.Enum.SITE
            ? (bind() as any)
            : {})}
        >
          {pipe(
            columnLayout,
            RA.chain(({ columnIndex, gridGroups, z: columnZ }) =>
              pipe(
                gridGroups,
                RA.chain(({ modules, levelIndex, y: levelY }) =>
                  pipe(
                    modules,
                    RA.map(({ module, gridGroupIndex, z: moduleZ }) => (
                      <GltfModule2
                        key={indicesToKey({
                          columnIndex,
                          levelIndex,
                          gridGroupIndex,
                        })}
                        {...{
                          houseId: id,
                          module,
                          columnIndex,
                          levelIndex,
                          gridGroupIndex,
                          columnZ,
                          levelY,
                          moduleZ,
                        }}
                      />
                    ))
                  )
                )
              )
            )
          )}
        </group>
        {editMode === EditModeEnum.Enum.MOVE_ROTATE && (
          <RotateHandles houseId={id} houseLength={0} houseWidth={0} />
        )}
      </group>
      {editMode === EditModeEnum.Enum.MOVE_ROTATE && (
        <VerticalHandle houseId={id} />
      )}
    </Fragment>
  )

  // if you're just at site level
  //   only need to render the whole house external

  // if you're in building mode
  //   render external the same but you do need columns
  //     and stretchability

  // if you're in level mode
  //   that's when you need internal etc

  // remember you want to be able to stretch from level mode

  switch (siteCtxMode) {
    default:
      return <Fragment></Fragment>
    case SiteCtxModeEnum.Enum.SITE:
      return (
        <Fragment>
          <group ref={houseGroupRef}>
            <group {...bind()}>
              {columnLayout.map(({ columnIndex, z, gridGroups }) => {
                return (
                  <GltfColumn
                    key={columnIndex}
                    houseId={id}
                    columnIndex={columnIndex}
                    columnZ={z}
                    gridGroups={gridGroups}
                    verticalCutPlanes={[]}
                    mirror={columnIndex === columnLayout.length - 1}
                  />
                )
              })}
            </group>
            {editMode === EditModeEnum.Enum.MOVE_ROTATE && (
              <RotateHandles houseId={id} houseLength={0} houseWidth={0} />
            )}
          </group>
          {editMode === EditModeEnum.Enum.MOVE_ROTATE && (
            <VerticalHandle houseId={id} />
          )}
        </Fragment>
      )
    case SiteCtxModeEnum.Enum.BUILDING:
    case SiteCtxModeEnum.Enum.LEVEL:
      return null
    // return (
    //   <group position={[buildingX, 0, buildingZ]} rotation={[0, rotation, 0]}>
    //     <group ref={startHandleRef}>
    //       {renderColumn(startColumn)}

    //       {editMode === EditModeEnum.Enum.STRETCH && (
    //         <StretchHandle
    //           onDrag={({ first, last }) => {
    //             const [, pz] = rotateVector(pointer.xz)
    //             const [, bz] = rotateVector([buildingX, buildingZ])

    //             const z = pipe(handleOffset + pz - bz, startClamp)

    //             startHandleRef.current.position.z = z

    //             sendDrag(z, { isStart: true, first })

    //             if (last) {
    //               startHandleRef.current.position.z = 0
    //               sendDrop()
    //             }
    //           }}
    //           position-z={startColumn.z - handleOffset}
    //         />
    //       )}
    //     </group>
    //     <group ref={endHandleRef}>
    //       {renderColumn(endColumn)}
    //       {editMode === EditModeEnum.Enum.STRETCH && (
    //         <StretchHandle
    //           onDrag={({ first, last }) => {
    //             const [, pz] = rotateVector(pointer.xz)
    //             const [, bz] = rotateVector([buildingX, buildingZ])

    //             const z = pipe(
    //               -(endColumn.z + handleOffset) + pz - bz,
    //               endClamp
    //             )

    //             endHandleRef.current.position.z = z

    //             sendDrag(z, { isStart: false, first })

    //             if (last) {
    //               endHandleRef.current.position.z = 0
    //               sendDrop()
    //             }
    //           }}
    //           position-z={endColumn.z + endColumn.length + handleOffset}
    //         />
    //       )}
    //     </group>
    //     {/* <MidColumns
    //       columnLayout={columnLayout}
    //       buildingId={buildingId}
    //       midColumns={midColumns}
    //       verticalCutPlanes={verticalCutPlanes}
    //     />
    //     <StretchedColumns
    //       {...{ endColumn, startColumn, vanillaPositionedRows }}
    //     />
    //     {canStretchWidth && (
    //       <Fragment>
    //         <StretchHandle
    //           ref={leftHandleRef}
    //           onHover={widthStretchHoverHandler}
    //           onDrag={({ first, last }) => {
    //             if (!leftHandleRef.current) return

    //             if (first) {
    //               widthHandleDragging = true
    //             }

    //             const [px] = rotateVector(pointer.xz)
    //             const [bx] = rotateVector([buildingX, buildingZ])

    //             const leftClamp = clamp(
    //               minWidth / 2 + handleOffset,
    //               maxWidth / 2 + handleOffset
    //             )

    //             const x = pipe(px - bx, leftClamp)

    //             leftHandleRef.current.position.x = x
    //             sendWidthDrag(x - handleOffset)

    //             if (last) {
    //               widthHandleDragging = false
    //               leftHandleRef.current.position.x =
    //                 houseWidth / 2 + handleOffset
    //               sendWidthDrop()
    //             }
    //           }}
    //           position={[houseWidth / 2 + handleOffset, 0, houseLength / 2]}
    //         />
    //         <StretchHandle
    //           ref={rightHandleRef}
    //           onHover={widthStretchHoverHandler}
    //           onDrag={({ first, last }) => {
    //             if (!rightHandleRef.current) return

    //             if (first) {
    //               widthHandleDragging = true
    //             }

    //             const [px] = rotateVector(pointer.xz)
    //             const [bx] = rotateVector([buildingX, buildingZ])

    //             const rightClamp = clamp(
    //               -(maxWidth / 2 + handleOffset),
    //               -(minWidth / 2 + handleOffset)
    //             )

    //             const x = pipe(px - bx, rightClamp)

    //             rightHandleRef.current.position.x = x
    //             sendWidthDrag(x + handleOffset)

    //             if (last) {
    //               widthHandleDragging = false
    //               rightHandleRef.current.position.x = -(
    //                 houseWidth / 2 +
    //                 handleOffset
    //               )
    //               sendWidthDrop()
    //             }
    //           }}
    //           position={[
    //             -(houseWidth / 2 + handleOffset),
    //             0,
    //             houseLength / 2,
    //           ]}
    //         />
    //         {widthGatesEnabled && (
    //           <group position={[0, 0, houseLength / 2]}>
    //             {[gateLineX, -gateLineX].map((x) => {
    //               return (
    //                 <mesh
    //                   key={x}
    //                   position={[x, 0, 0]}
    //                   rotation-x={Math.PI / 2}
    //                 >
    //                   <planeBufferGeometry args={[0.15, houseLength + 10]} />
    //                   <meshBasicMaterial color="white" side={DoubleSide} />
    //                 </mesh>
    //               )
    //             })}
    //           </group>
    //         )}
    //       </Fragment>
    //     )} */}
    //   </group>
    // )
  }
}

export default GltfHouse
