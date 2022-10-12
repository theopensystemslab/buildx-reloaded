import { useColumnLayout } from "@/hooks/layouts"
import { useGesture } from "@use-gesture/react"
import IfcColumn from "./IfcColumn"

type Props = {
  id: string
}

const IfcHouse = (props: Props) => {
  const { id } = props
  const columns = useColumnLayout(id)

  const bind = useGesture({
    onDrag: ({ first, last }) => {
      // if (first) console.log("first")
      // console.log("dragging")
      // if (last) console.log("last")
    },
  })

  return (
    <group {...(bind() as any)}>
      {columns.map(({ columnIndex, z, gridGroups }) => {
        return (
          <IfcColumn
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

export default IfcHouse
