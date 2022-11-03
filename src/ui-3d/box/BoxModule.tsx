import { GroupProps } from "@react-three/fiber"
import { Plane } from "three"
import { Module } from "../../data/modules"

type Props = GroupProps & {
  module: Module
  columnIndex: number
  levelIndex: number
  groupIndex: number
  houseId: string
  levelY: number
  verticalCutPlanes: Plane[]
}

const BoxModule = (props: Props) => {
  const {
    houseId,
    columnIndex,
    levelIndex,
    groupIndex,
    module,
    levelY,
    verticalCutPlanes,
    ...groupProps
  } = props

  const key = `${houseId}:${columnIndex},${levelIndex},${groupIndex}`

  return (
    <group {...groupProps}>
      <mesh position-y={module.height / 2} position-z={-module.length / 2}>
        <boxGeometry args={[module.width, module.height, module.length]} />
        <meshBasicMaterial color="tomato" wireframe />
      </mesh>
    </group>
  )
}

export default BoxModule
