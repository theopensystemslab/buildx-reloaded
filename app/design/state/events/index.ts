import { useEvent } from "react-use"

const MOVE_HOUSE_INTENT_EVENT = "MoveHouseIntentEvent"
const MOVE_HOUSE_EVENT = "MoveHouseEvent"
const ROTATE_HOUSE_EVENT = "RotateHouseEvent"
const ROTATE_HOUSE_INTENT_EVENT = "RotateHouseIntentEvent"
const STRETCH_HOUSE_INTENT_EVENT = "StretchHouseIntentEvent"

type MoveHouseDetail = {
  delta: V3
  houseId: string
  last: boolean
}

type RotateHouseDetail = {
  rotation: number
  houseId: string
}

type StretchHouseDetail = {
  houseId: string
  // look at your stretch proxies to figure this
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

export const dispatchStretchHouseIntent = (detail: StretchHouseDetail) =>
  dispatchEvent(new CustomEvent(STRETCH_HOUSE_INTENT_EVENT, { detail }))

export const useStretchHouseIntentListener = (
  f: (eventDetail: StretchHouseDetail) => void
) => useEvent(STRETCH_HOUSE_INTENT_EVENT, f)
