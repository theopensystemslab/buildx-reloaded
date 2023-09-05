import { ArrowDown } from "@carbon/icons-react"
import { dispatchGetModelEvent } from "../../../../workers/exporters/events"
import ContextMenuButton from "../../menu/common/ContextMenuButton"
import ContextMenuNested from "../../menu/common/ContextMenuNested"

const Exporters = ({ houseId }: { houseId: string }) => {
  return (
    <ContextMenuNested icon={<ArrowDown size={20} />} label={`Export`}>
      <ContextMenuButton
        icon={<ArrowDown size={20} />}
        text="OBJ"
        onClick={() => void dispatchGetModelEvent({ houseId, format: "OBJ" })}
      />
      <ContextMenuButton
        icon={<ArrowDown size={20} />}
        text="GLB"
        onClick={() => void dispatchGetModelEvent({ houseId, format: "GLB" })}
      />
    </ContextMenuNested>
  )
}

export default Exporters
