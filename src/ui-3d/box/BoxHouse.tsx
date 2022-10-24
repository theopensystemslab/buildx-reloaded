import { useColumnLayout } from "@/hooks/layouts"
import { useGesture } from "@use-gesture/react"
import { Fragment, useRef } from "react"
import { Group } from "three"
import { useDimensionsSubscription } from "../../hooks/dimensions"
import {
  useHouseEventHandlers,
  useMoveRotateSubscription,
} from "../../hooks/houses"
import RotateHandles from "../RotateHandles"
import BoxColumn from "./BoxColumn"
import VerticalHandle from "../VerticalHandle"

type Props = {
  id: string
}

const BoxHouse = (props: Props) => {
  const groupRef = useRef<Group>(null!)
  const { id } = props
  const columns = useColumnLayout(id)

  useDimensionsSubscription(id, columns)
  useMoveRotateSubscription(id, groupRef)

  const bind = useHouseEventHandlers(id)

  return (
    <Fragment>
      <group ref={groupRef}>
        <group {...bind()}>
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
        </group>
        <RotateHandles houseId={id} houseLength={0} houseWidth={0} />
      </group>
      <VerticalHandle houseId={id} />
    </Fragment>
  )
}

export default BoxHouse
