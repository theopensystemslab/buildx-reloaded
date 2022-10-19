import { useColumnLayout } from "@/hooks/layouts"
import { useGesture } from "@use-gesture/react"
import { Fragment, useRef } from "react"
import { Group } from "three"
import { useOBBSubscriber } from "../../hooks/obb"
import { useMoveHouse } from "../../hooks/houses"
import RotateHandles from "../RotateHandles"
import BoxColumn from "./BoxColumn"

type Props = {
  id: string
}

const BoxHouse = (props: Props) => {
  const groupRef = useRef<Group>(null!)
  const { id } = props
  const columns = useColumnLayout(id)

  useOBBSubscriber(id, columns)

  const { houseDragHandler } = useMoveHouse(id, groupRef)

  const bind = useGesture({
    onDrag: houseDragHandler as any,
  })

  return (
    <Fragment>
      <group ref={groupRef} {...(bind() as any)}>
        {columns.map(({ columnIndex, z, gridGroups }) => {
          return (
            <BoxColumn
              key={columnIndex}
              houseId={id}
              columnIndex={columnIndex}
              columnZ={z}
              gridGroups={gridGroups}
              verticalCutPlanes={[]}
              mirror={columnIndex === columns.length - 1}
            />
          )
        })}
        <RotateHandles houseId={id} houseLength={0} houseWidth={0} />
      </group>
    </Fragment>
  )
}

export default BoxHouse
