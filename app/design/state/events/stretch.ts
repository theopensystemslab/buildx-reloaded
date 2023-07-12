import { useEvent } from "react-use"

const Z_STRETCH_HOUSE_INTENT_EVENT = "ZStretchHouseIntentEvent"
const Z_STRETCH_HOUSE_EVENT = "ZStretchHouseEvent"

const X_STRETCH_HOUSE_INTENT_EVENT = "XStretchHouseIntentEvent"
const X_STRETCH_HOUSE_EVENT = "XStretchHouseEvent"

type StretchHouseDetail = {
  houseId: string
  direction: 1 | -1
  dx: number
  dz: number
  distance: number
  last: boolean
}

export const dispatchZStretchHouseIntent = (detail: StretchHouseDetail) =>
  dispatchEvent(new CustomEvent(Z_STRETCH_HOUSE_INTENT_EVENT, { detail }))

export const dispatchZStretchHouse = (detail: StretchHouseDetail) =>
  dispatchEvent(new CustomEvent(Z_STRETCH_HOUSE_EVENT, { detail }))

export const useZStretchHouseIntentListener = (
  f: (eventDetail: StretchHouseDetail) => void
) => useEvent(Z_STRETCH_HOUSE_INTENT_EVENT, ({ detail }) => f(detail))

export const useZStretchHouseListener = (
  f: (eventDetail: StretchHouseDetail) => void
) => useEvent(Z_STRETCH_HOUSE_EVENT, ({ detail }) => f(detail))

export const dispatchXStretchHouseIntent = (detail: StretchHouseDetail) =>
  dispatchEvent(new CustomEvent(X_STRETCH_HOUSE_INTENT_EVENT, { detail }))

export const dispatchXStretchHouse = (detail: StretchHouseDetail) =>
  dispatchEvent(new CustomEvent(X_STRETCH_HOUSE_EVENT, { detail }))

export const useXStretchHouseIntentListener = (
  f: (eventDetail: StretchHouseDetail) => void
) => useEvent(X_STRETCH_HOUSE_INTENT_EVENT, ({ detail }) => f(detail))

export const useXStretchHouseListener = (
  f: (eventDetail: StretchHouseDetail) => void
) => useEvent(X_STRETCH_HOUSE_EVENT, ({ detail }) => f(detail))
