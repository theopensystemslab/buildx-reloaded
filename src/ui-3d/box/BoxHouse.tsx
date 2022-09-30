import { useColumnLayout } from "@/hooks/layouts"
import { useGesture } from "@use-gesture/react"
import { setCameraEnabled } from "../../hooks/camera"
import BoxColumn from "./BoxColumn"

type Props = {
  id: string
}

const BoxHouse = (props: Props) => {
  const { id } = props
  const columns = useColumnLayout(id)

  const bind = useGesture({
    onDrag: (state) => {
      const { first, last } = state
      if (first) setCameraEnabled(false)
      const { delta, direction } = state
      console.log(delta, direction)
      if (last) setCameraEnabled(true)
    },
  })

  return (
    <group {...(bind() as any)}>
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
  )
}

export default BoxHouse
