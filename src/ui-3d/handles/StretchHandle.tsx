import { RoundedBox } from "@react-three/drei"
import { GroupProps } from "@react-three/fiber"
import { forwardRef } from "react"
import { Group } from "three"
import { useHouseDimensions } from "../../hooks/dimensions"
import { HandleSide, HandleSideEnum } from "../../hooks/gestures/drag/handles"
import { useHandleMaterial } from "../../hooks/handleMaterial"
import { EditModeEnum } from "../../hooks/siteCtx"
import { PI } from "../../utils/math"

type Props = GroupProps & {
  houseId: string
  side: HandleSide
}

const StretchHandle = forwardRef<Group, Props>(
  ({ houseId, side, ...groupProps }, ref) => {
    const OFFSET_XZ = 0.5
    const OFFSET_Y = 0.1

    const { length: houseLength, width: houseWidth } =
      useHouseDimensions(houseId)

    const position: [number, number, number] = (() => {
      switch (side) {
        case HandleSideEnum.Enum.FRONT:
          return [0, OFFSET_Y, -OFFSET_XZ]
        case HandleSideEnum.Enum.BACK:
          return [0, OFFSET_Y, houseLength + OFFSET_XZ]
        case HandleSideEnum.Enum.LEFT:
          return [houseWidth / 2 + OFFSET_XZ, OFFSET_Y, houseLength / 2]
        case HandleSideEnum.Enum.RIGHT:
          return [-(houseWidth / 2 + OFFSET_XZ), OFFSET_Y, houseLength / 2]
      }
    })()

    const rotation: [number, number, number] = (() => {
      switch (side) {
        case HandleSideEnum.Enum.FRONT:
        case HandleSideEnum.Enum.BACK:
          return [0, 0, 0]
        case HandleSideEnum.Enum.LEFT:
        case HandleSideEnum.Enum.RIGHT:
          return [0, PI / 2, 0]
      }
    })()

    const handleMaterial = useHandleMaterial()

    return (
      <group ref={ref} {...groupProps}>
        <RoundedBox
          position={position}
          rotation={rotation}
          args={[(houseWidth * 2) / 0.5, 1, 1]}
          radius={0.5}
          scale-x={0.4}
          scale-y={0.001}
          scale-z={0.4}
          material={handleMaterial}
          userData={{
            identifier: {
              identifierType: "handle",
              houseId,
              editMode: EditModeEnum.Enum.STRETCH,
              side,
            },
          }}
        />
      </group>
    )
  }
)

export default StretchHandle
