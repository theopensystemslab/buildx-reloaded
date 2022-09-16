import { useColumnLayout } from "@/hooks/layouts"
import IfcColumn from "./IfcColumn"

type Props = {
  id: string
}

const IfcHouse = (props: Props) => {
  const { id } = props
  const columns = useColumnLayout(id)

  console.log(id)

  return (
    <group>
      {columns.map(({ columnIndex, z, gridGroups, length }) => (
        <IfcColumn
          key={columnIndex}
          houseId={id}
          columnIndex={columnIndex}
          columnZ={z}
          gridGroups={gridGroups}
          verticalCutPlanes={[]}
          mirror={columnIndex === columns.length - 1}
        />
      ))}
    </group>
  )
}

export default IfcHouse
