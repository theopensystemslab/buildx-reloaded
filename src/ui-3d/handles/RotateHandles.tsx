import { GroupProps, MeshProps } from "@react-three/fiber"
import { forwardRef } from "react"
import { Group } from "three"
import { useHouseDimensions } from "../../hooks/dimensions"
import { RotateHandleIdentifier } from "../../hooks/gestures/drag"
import { useHandleMaterial } from "../../hooks/handleMaterial"
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

type Props = {
  houseId: string
} & GroupProps

const RotateHandles = forwardRef<Group, Props>(
  ({ houseId, ...groupProps }, ref) => {
    const { length: houseLength, width: houseWidth } =
      useHouseDimensions(houseId)

    const handleMaterial = useHandleMaterial()

    const OFFSET = 5

    const identifier: RotateHandleIdentifier = {
      identifierType: "ROTATE_HANDLE",
      houseId,
    }

    return (
      <group ref={ref} {...groupProps}>
        <RotateCircle
          position={[0, 0, -OFFSET]}
          userData={{
            identifier,
          }}
        />
        <mesh
          material={handleMaterial}
          rotation-x={-PI / 2}
          position={[0, 0, -OFFSET / 2]}
          userData={{
            identifier,
          }}
        >
          <planeGeometry args={[SIZE, OFFSET, 1]} />
        </mesh>

        <RotateCircle
          position={[-houseWidth / 2 - OFFSET, 0, houseLength / 2]}
          userData={{
            identifier,
          }}
        />
        <mesh
          material={handleMaterial}
          rotation-x={-PI / 2}
          position={[-houseWidth / 1.05, 0, houseLength / 2]}
          userData={{
            identifier,
          }}
        >
          <planeGeometry args={[OFFSET, SIZE, 1]} />
        </mesh>
      </group>
    )
  }
)

export default RotateHandles
