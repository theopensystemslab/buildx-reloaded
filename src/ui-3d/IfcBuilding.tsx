import { useColumnLayout } from "@/hooks/layouts"
import IfcColumn from "./IfcColumn"

type Props = {
  id: string
}

const IfcBuilding = (props: Props) => {
  const { id } = props
  const columns = useColumnLayout(id)

  return (
    <group>
      {columns.slice(1, 2).map(({ columnIndex, z, gridGroups, length }) => (
        <IfcColumn
          key={columnIndex}
          buildingId={id}
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

export default IfcBuilding
