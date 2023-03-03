import { RoundedBox } from "@react-three/drei"
import { GroupProps } from "@react-three/fiber"
import { forwardRef } from "react"
import { Group } from "three"
import { useHouseDimensions } from "../../hooks/dimensions"
import { StretchHandleIdentifier } from "../../hooks/gestures/drag"
import { useHandleMaterial } from "../../hooks/handleMaterial"
import { EditModeEnum } from "../../hooks/siteCtx"
import { PI } from "../../utils/math"

type Props = GroupProps & {
  houseId: string
  axis: "x" | "z"
  direction: 1 | -1
  disable?: boolean
}

const StretchHandle = forwardRef<Group, Props>(
  ({ houseId, axis, direction, disable = false, ...groupProps }, ref) => {
    const OFFSET_XZ = 0.5
    const OFFSET_Y = 0.1

    const { length: houseLength, width: houseWidth } =
      useHouseDimensions(houseId)

    const position: [number, number, number] =
      axis === "z"
        ? direction === 1
          ? [0, OFFSET_Y, houseLength + OFFSET_XZ]
          : [0, OFFSET_Y, -OFFSET_XZ]
        : direction === 1
        ? [houseWidth / 2 + OFFSET_XZ, OFFSET_Y, houseLength / 2]
        : [-(houseWidth / 2 + OFFSET_XZ), OFFSET_Y, houseLength / 2]

    const rotation: [number, number, number] =
      axis === "x" ? [0, PI / 2, 0] : [0, 0, 0]

    const handleMaterial = useHandleMaterial()

    const identifier: StretchHandleIdentifier = {
      identifierType: "STRETCH_HANDLE",
      houseId,
      direction,
      axis,
    }

    return (
      <group ref={ref} scale={disable ? [0, 0, 0] : [1, 1, 1]} {...groupProps}>
        <RoundedBox
          position={position}
          rotation={rotation}
          args={[((axis === "z" ? houseWidth : houseLength) * 2) / 1.5, 1, 1]}
          radius={0.5}
          scale-x={0.4}
          scale-y={0.001}
          scale-z={0.4}
          material={handleMaterial}
          userData={{
            identifier,
          }}
        />
      </group>
    )
  }
)

export default StretchHandle
