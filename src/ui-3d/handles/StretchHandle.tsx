import { RoundedBox } from "@react-three/drei"
import { useHouseDimensions } from "../../hooks/dimensions"
import { HandleSide, HandleSideEnum } from "../../hooks/gestures/drag/handles"
import { useHandleMaterial } from "../../hooks/handleMaterial"
import { EditModeEnum } from "../../hooks/siteCtx"

const StretchHandle = ({
  houseId,
  side,
}: {
  houseId: string
  side: HandleSide
}) => {
  const OFFSET = 0.5

  const { length: houseLength, width: houseWidth } = useHouseDimensions(houseId)

  const getOffset = () => {
    switch (side) {
      case HandleSideEnum.Enum.FRONT:
        return -OFFSET
      case HandleSideEnum.Enum.BACK:
        return houseLength + OFFSET
      case HandleSideEnum.Enum.LEFT:
        return houseWidth / 2 + OFFSET
      case HandleSideEnum.Enum.RIGHT:
        return -(houseWidth / 2 + OFFSET)
    }
  }

  const offset = getOffset()

  const handleMaterial = useHandleMaterial()
  return (
    <group position={[0, 0.1, offset]}>
      <RoundedBox
        args={[(houseWidth * 2) / 1.5, 1, 1]}
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

export default StretchHandle
