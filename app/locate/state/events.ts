import { z } from "zod"

export const LocateEvents = z.enum(["GeocoderEntered", "GeocoderClickAway"])

export type LocateEvent = z.infer<typeof LocateEvents>

export const dispatchLocateEvent = (e: LocateEvent) =>
  dispatchEvent(new CustomEvent(e))
