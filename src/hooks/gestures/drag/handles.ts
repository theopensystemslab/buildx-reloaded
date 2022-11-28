import { HandleSide } from "../../drag/handles"
import { EditMode } from "../../siteCtx"

export type HandleIdentifier = {
  identifierType: "handle"
  houseId: string
  editMode: EditMode
  side: HandleSide
}
