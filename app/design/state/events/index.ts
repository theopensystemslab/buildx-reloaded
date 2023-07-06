import { useEvent } from "react-use"

const MOVE_HOUSE_INTENT_EVENT = "MoveHouseIntentEvent"
const MOVE_HOUSE_EVENT = "MoveHouseEvent"

const ROTATE_HOUSE_EVENT = "RotateHouseEvent"
const ROTATE_HOUSE_INTENT_EVENT = "RotateHouseIntentEvent"

const Z_STRETCH_HOUSE_INTENT_EVENT = "ZStretchHouseIntentEvent"
const Z_STRETCH_HOUSE_EVENT = "ZStretchHouseEvent"

const X_STRETCH_HOUSE_INTENT_EVENT = "XStretchHouseIntentEvent"
const X_STRETCH_HOUSE_EVENT = "XStretchHouseEvent"

type MoveHouseDetail = {
  delta: V3
  houseId: string
  last: boolean
}

type RotateHouseDetail = {
  rotation: number
  houseId: string
  last: boolean
}

type StretchHouseDetail = {
  houseId: string
  direction: 1 | -1
  dx: number
  dz: number
  distance: number
  last: boolean
}

export const dispatchMoveHouseIntent = (detail: MoveHouseDetail) =>
  dispatchEvent(
    new CustomEvent(MOVE_HOUSE_INTENT_EVENT, {
      detail,
    })
  )

export const dispatchMoveHouse = (detail: MoveHouseDetail) =>
  dispatchEvent(
    new CustomEvent(MOVE_HOUSE_EVENT, {
      detail,
    })
  )

export const useMoveHouseIntentListener = (
  f: (eventDetail: MoveHouseDetail) => void
) => useEvent(MOVE_HOUSE_INTENT_EVENT, ({ detail }) => f(detail))

export const useMoveHouseListener = (
  f: (eventDetail: MoveHouseDetail) => void
) => useEvent(MOVE_HOUSE_EVENT, ({ detail }) => f(detail))

export const dispatchRotateHouseIntent = (detail: RotateHouseDetail) =>
  dispatchEvent(new CustomEvent(ROTATE_HOUSE_INTENT_EVENT, { detail }))

export const dispatchRotateHouse = (detail: RotateHouseDetail) =>
  dispatchEvent(
    new CustomEvent(ROTATE_HOUSE_EVENT, {
      detail,
    })
  )

export const useRotateHouseIntentListener = (
  f: (eventDetail: RotateHouseDetail) => void
) => useEvent(ROTATE_HOUSE_INTENT_EVENT, ({ detail }) => f(detail))

export const useRotateHouseListener = (
  f: (eventDetail: RotateHouseDetail) => void
) => useEvent(ROTATE_HOUSE_EVENT, ({ detail }) => f(detail))

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
