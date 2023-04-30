import { z } from "zod"

export const LocateEvents = z.enum([
  "UserEnteredSearch",
  "UserClickedGeocoderAway",
  "UserCompletedPolygon",
  "UserTrashedPolygon",
  "UserClickedGeocoderButton",
])

export type LocateEventsType = z.infer<typeof LocateEvents>
