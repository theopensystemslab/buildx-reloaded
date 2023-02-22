import { EditMode } from "../../siteCtx"
import * as z from "zod"

export type HandleIdentifier = {
  identifierType: "handle"
  houseId: string
  editMode: EditMode
  direction?: 1 | -1
}
