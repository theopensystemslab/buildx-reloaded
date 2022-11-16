import { Instances } from "@react-three/drei"
import { useHandleDragStart } from "../../hooks/drag/handles"
import { useVanillaColumn } from "../../hooks/layouts"
import { EditModeEnum } from "../../hooks/siteCtx"

const StretchInstancesMain = ({ houseId }: { houseId: string }) => {
  const vanillaColumn = useVanillaColumn(houseId)
  console.log(vanillaColumn)
  // z before end column starts
  // z after start column ends
  // big z (upper limit)
  // negative big z (lower limit)
  // map instances
  return (
    <Instances>
      <boxBufferGeometry />
      <meshBasicMaterial />
    </Instances>
  )
}

const StretchInstances = () => {
  const handleDragStart = useHandleDragStart()
  return handleDragStart === null ||
    handleDragStart.handleIdentifier.editMode !==
      EditModeEnum.Enum.STRETCH ? null : (
    <StretchInstancesMain houseId={handleDragStart.handleIdentifier.houseId} />
  )
}

export default StretchInstances
