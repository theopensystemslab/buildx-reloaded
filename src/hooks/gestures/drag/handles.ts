import { EditMode } from "../../siteCtx"
import * as z from "zod"

export const HandleSideEnum = z.enum(["FRONT", "BACK", "LEFT", "RIGHT"])

export type HandleSide = z.infer<typeof HandleSideEnum>

export type HandleIdentifier = {
  identifierType: "handle"
  houseId: string
  editMode: EditMode
  side: HandleSide
}
