import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useMemo, useRef } from "react"
import { Box3, Group, Matrix4, Vector3 } from "three"
import { OBB } from "three-stdlib"
import { LayoutKey, serializeLayoutKey } from "../../../db/layouts"
import { House } from "../../../db/user"
import { RA } from "../../../utils/functions"
import { splitColumns } from "../../../workers/layouts"
import dimensions, { collideOBB, Dimensions } from "../../state/dimensions"
import {
  dispatchMoveHouse,
  useMoveHouseIntentListener,
  useMoveHouseListener,
} from "../../state/events"
import { useHouseMaterialOps } from "../../state/hashedMaterials"
import houses from "../../state/houses"
import ZStretch from "../../state/interactions/ZStretch"
import { useDnasLayout } from "../../state/layouts"
import { useTransformabilityBooleans } from "../../state/siteCtx"
import RotateHandles from "../handles/RotateHandles"
import StretchHandle from "../handles/StretchHandle"
import GroupedColumn from "./GroupedColumn"
import StretchWidth from "./stretchWidth/StretchWidth"

type Props = {
  house: House
}

const GroupedHouse2 = (props: Props) => {
  const { house } = props
  const { systemId, id: houseId, position, rotation } = house
  const dnas = [...house.dnas]

  const layoutKey: LayoutKey = { systemId, dnas }

  const strLayoutKey = serializeLayoutKey(layoutKey)

  const translationMatrix = useMemo(() => {
    const m = new Matrix4()
    const { x, y, z } = position
    m.makeTranslation(x, y, z)
    return m
  }, [position])

  const rotationMatrix = useMemo(() => {
    const m = new Matrix4()
    m.makeRotationY(rotation)
    return m
  }, [rotation])

  const reactHouseMatrix = translationMatrix.multiply(rotationMatrix)

  const rootRef = useRef<Group>(null)
  const startRef = useRef<Group>(null!)
  const endRef = useRef<Group>(null!)

  const { stretchEnabled, moveRotateEnabled } =
    useTransformabilityBooleans(houseId)

  const layout = useDnasLayout(layoutKey)

  const { width, length, height, obb }: Dimensions = useMemo(() => {
    const width = layout[0].gridGroups[0].modules[0].module.width
    const height = layout[0].gridGroups.reduce(
      (acc, gg) => acc + gg.modules[0].module.height,
      0
    )
    const z0 = layout[0].gridGroups[0].modules[0].z
    const lastColumn = layout[layout.length - 1]
    const lastGridGroup =
      lastColumn.gridGroups[lastColumn.gridGroups.length - 1]
    const lastModule = lastGridGroup.modules[lastGridGroup.modules.length - 1]
    const z1 = lastColumn.z + lastModule.z + lastModule.module.length

    const length = z1 - z0

    const halfSize = new Vector3(width / 2, height / 2, length / 2)
    const center = new Vector3(0, height / 2, length / 2)
    const obb = new OBB(center, halfSize)

    obb.applyMatrix4(reactHouseMatrix)

    dimensions[houseId] = {
      height,
      length,
      width,
      obb,
    }

    return {
      height,
      length,
      width,
      obb,
    }
  }, [layout, reactHouseMatrix, houseId])

  const { startColumn, endColumn, midColumns } = splitColumns(layout)

  // const ZStretch = ZStretch({
  // })

  const obbBox = useMemo(() => {
    const box3 = new Box3().setFromCenterAndSize(
      obb.center,
      obb.halfSize.clone().multiplyScalar(2)
    )
    box3.applyMatrix4(rotationMatrix)
    return box3
  }, [obb.center, obb.halfSize, rotationMatrix])

  // const box3HelperRef = useRef<Box3Helper>(null)

  // useEffect(() => {
  //   box3HelperRef.current?.layers.disableAll()
  //   box3HelperRef.current?.layers.enable(CameraLayer.VISIBLE)
  // }, [])

  useEffect(() => {
    if (!rootRef.current) return
    rootRef.current.matrixAutoUpdate = false
    rootRef.current.matrix.copy(reactHouseMatrix)
  }, [reactHouseMatrix])

  const frameOBB = useRef(new OBB())
  const frameHouseMatrix = useRef(new Matrix4())

  useMoveHouseIntentListener((detail) => {
    if (detail.houseId !== houseId) return

    const { x, z } = detail.delta

    const deltaMatrix = new Matrix4().makeTranslation(x, 0, z)
    frameHouseMatrix.current = reactHouseMatrix.clone()
    frameHouseMatrix.current.multiply(deltaMatrix)

    frameOBB.current.copy(obb)
    frameOBB.current.applyMatrix4(deltaMatrix)

    const collision = collideOBB(frameOBB.current, [houseId])
    if (collision) return

    dispatchMoveHouse(detail)
  })

  useMoveHouseListener((detail) => {
    if (!rootRef.current || houseId !== detail.houseId) return

    rootRef.current.matrix.copy(frameHouseMatrix.current)
    rootRef.current.updateMatrixWorld()
    invalidate()

    if (detail.last) {
      const { x, y, z } = detail.delta

      houses[houseId].position = {
        x: position.x + x,
        y: position.y + y,
        z: position.z + z,
      }
    }
  })

  // const { columnsUp, columnsDown } = useStretchLength({ startColumn, endColumn, midColumns })

  useHouseMaterialOps({
    houseId,
    ref: rootRef,
    layoutsKey: serializeLayoutKey({ systemId, dnas }),
  })

  const startColumnRef = useRef<Group>(null!)
  const midColumnsRef = useRef<Group>(null!)
  const endColumnRef = useRef<Group>(null!)

  const setHouseVisible = (b: boolean) =>
    [startColumnRef, midColumnsRef, endColumnRef].forEach((ref) => {
      ref.current.visible = b
    })

  return (
    <Fragment>
      <group
        ref={rootRef}
        position-x={position.x}
        position-y={position.y}
        position-z={position.z}
        rotation-y={rotation}
      >
        <group ref={startRef}>
          <StretchHandle
            houseId={houseId}
            axis="z"
            direction={-1}
            disable={!stretchEnabled}
          />
          <GroupedColumn
            ref={startColumnRef}
            key={`${houseId}:${startColumn.columnIndex}`}
            column={startColumn}
            {...{ systemId, houseId, start: true }}
          />
        </group>
        <group ref={midColumnsRef}>
          {pipe(
            midColumns,
            RA.map((column) => (
              <GroupedColumn
                key={`${houseId}:${column.columnIndex}`}
                column={column}
                {...{ systemId, houseId }}
              />
            ))
          )}
        </group>
        <group ref={endRef}>
          <GroupedColumn
            ref={endColumnRef}
            key={`${houseId}:${endColumn.columnIndex}`}
            column={endColumn}
            {...{ systemId, houseId, end: true }}
          />
          <StretchHandle
            houseId={houseId}
            axis="z"
            direction={1}
            disable={!stretchEnabled}
          />
        </group>

        <StretchWidth
          houseId={houseId}
          columnLayout={layout}
          setHouseVisible={setHouseVisible}
        />

        <RotateHandles
          houseId={houseId}
          scale={moveRotateEnabled ? [1, 1, 1] : [0, 0, 0]}
        />

        <group scale={stretchEnabled ? [1, 1, 1] : [0, 0, 0]}>
          <ZStretch
            {...{
              houseId,
              layoutKey,
              reactHouseMatrix,
              width,
              height,
              length,
              startColumn,
              endColumn,
              startRef,
              endRef,
            }}
          />
        </group>

        {/* <PreviewHouses houseId={houseId} setHouseVisible={setHouseVisible} /> */}
      </group>

      {/* <box3Helper ref={box3HelperRef} args={[obbBox]} /> */}
      <mesh>
        <boxBufferGeometry />
        <meshBasicMaterial color="tomato" />
      </mesh>
    </Fragment>
  )
}

export default GroupedHouse2
