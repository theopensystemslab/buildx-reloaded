import { Instance } from "@react-three/drei"
import { useHouseDimensions } from "../../hooks/dimensions"
import { HandleSide, HandleSideEnum } from "../../hooks/gestures/drag/handles"
import { EditModeEnum } from "../../hooks/siteCtx"
import { PI } from "../../utils/math"

const StretchHandle = ({
  houseId,
  side,
}: {
  houseId: string
  side: HandleSide
}) => {
  const OFFSET = 1.5

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
    <Instance
      rotation-x={-PI / 2}
      position={[0, 0, offset]}
      userData={{
        identifier: {
          identifierType: "handle",
          houseId,
          editMode: EditModeEnum.Enum.STRETCH,
          side,
        },
      }}
    />
  )
}

export default StretchHandle
