import { Instance } from "@react-three/drei"
import { Fragment } from "react"
import { useHouseDimensions } from "../../hooks/dimensions"
import { EditModeEnum } from "../../hooks/siteCtx"
import { PI } from "../../utils/math"

const RotateHandles = ({ houseId }: { houseId: string }) => {
  const { length: houseLength, width: houseWidth } = useHouseDimensions(houseId)
  return (
    <Fragment>
      <Instance
        rotation-x={-PI / 2}
        position={[0, 0, -1.5]}
        userData={{
          identifier: {
            identifierType: "handle",
            houseId,
            editMode: EditModeEnum.Enum.MOVE_ROTATE,
          },
        }}
      />
      <Instance
        rotation-x={-PI / 2}
        position={[-houseWidth / 2 - 1.5, 0, houseLength / 2]}
        userData={{
          identifier: {
            identifierType: "handle",
            houseId,
            editMode: EditModeEnum.Enum.MOVE_ROTATE,
          },
        }}
      />
    </Fragment>
  )
}

export default RotateHandles
