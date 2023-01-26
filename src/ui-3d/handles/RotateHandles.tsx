import { MeshProps } from "@react-three/fiber"
import { Fragment } from "react"
import { useHouseDimensions } from "../../hooks/dimensions"
import { useHandleMaterial } from "../../hooks/handleMaterial"
import { EditModeEnum } from "../../hooks/siteCtx"
import { PI } from "../../utils/math"

const SIZE = 0.3

const RotateCircle = (props: MeshProps) => {
  const handleMaterial = useHandleMaterial()
  return (
    <mesh rotation-x={-PI / 2} material={handleMaterial} {...props}>
      <circleGeometry args={[0.5, 16]} />
    </mesh>
  )
}

const RotateHandles = ({ houseId }: { houseId: string }) => {
  const { length: houseLength, width: houseWidth } = useHouseDimensions(houseId)

  const handleMaterial = useHandleMaterial()

  const OFFSET = 5

  return (
    <Fragment>
      <RotateCircle
        position={[0, 0, -OFFSET]}
        userData={{
          identifier: {
            identifierType: "handle",
            houseId,
            editMode: EditModeEnum.Enum.MOVE_ROTATE,
          },
        }}
      />
      <mesh
        material={handleMaterial}
        rotation-x={-PI / 2}
        position={[0, 0, -OFFSET / 2]}
        userData={{
          identifier: {
            identifierType: "handle",
            houseId,
            editMode: EditModeEnum.Enum.MOVE_ROTATE,
          },
        }}
      >
        <planeGeometry args={[SIZE, OFFSET, 1]} />
      </mesh>

      <RotateCircle
        position={[-houseWidth / 2 - OFFSET, 0, houseLength / 2]}
        userData={{
          identifier: {
            identifierType: "handle",
            houseId,
            editMode: EditModeEnum.Enum.MOVE_ROTATE,
          },
        }}
      />
      <mesh
        material={handleMaterial}
        rotation-x={-PI / 2}
        position={[-houseWidth / 1.05, 0, houseLength / 2]}
        userData={{
          identifier: {
            identifierType: "handle",
            houseId,
            editMode: EditModeEnum.Enum.MOVE_ROTATE,
          },
        }}
      >
        <planeGeometry args={[OFFSET, SIZE, 1]} />
      </mesh>
    </Fragment>
  )
}

export default RotateHandles
