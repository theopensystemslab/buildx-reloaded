import { useHouseColumnLayout } from "@/hooks/layouts"
import { Fragment, useRef } from "react"
import { Group } from "three"
import { useHouseDimensionsUpdates } from "../../hooks/dimensions"
// import RotateHandles from "../RotateHandles"
import VerticalHandle from "../VerticalHandle"
import BoxColumn from "./BoxColumn"

type Props = {
  id: string
}

const BoxHouse = (props: Props) => {
  const groupRef = useRef<Group>(null!)
  const { id } = props
  const columns = useHouseColumnLayout(id)

  useHouseDimensionsUpdates(id)
  // useMoveRotateSubscription(id, groupRef)

  // const bind = useHouseEventHandlers(id)

  return (
    <Fragment>
      <group ref={groupRef}>
        {/* <group {...bind()}>
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
        </group> */}
        {/* <RotateHandles houseId={id} houseLength={0} houseWidth={0} /> */}
      </group>
      <VerticalHandle houseId={id} />
    </Fragment>
  )
}

export default BoxHouse
