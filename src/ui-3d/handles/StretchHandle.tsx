import { Line } from "@react-three/drei"
import { useHouseDimensions } from "../../hooks/dimensions"
import { HandleSide, HandleSideEnum } from "../../hooks/gestures/drag/handles"
import { EditModeEnum } from "../../hooks/siteCtx"

const StretchHandle = ({
  houseId,
  side,
}: {
  houseId: string
  side: HandleSide
}) => {
  const OFFSET = 0.25

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

  return (
    <group
      // rotation-y={-PI / 2}
      position={[0, 0.1, offset]}
    >
      <Line
        points={[
          [-houseWidth / 3, 0, 0],
          [houseWidth / 3, 0, 0],
        ]}
        // color="red"
        lineWidth={3}
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
