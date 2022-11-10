import { proxy } from "valtio"
import { ElementIdentifier } from "../data/elements"

type Events = {
  hover: ElementIdentifier | null
}

const events = proxy<Events>({
  hover: null,
})

export default events
