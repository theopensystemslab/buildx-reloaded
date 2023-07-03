import { useEvent } from "react-use"

const MOVE_HOUSE_INTENT_EVENT = "MoveHouseIntentEvent"
const MOVE_HOUSE_EVENT = "MoveHouseEvent"
const STRETCH_HOUSE_INTENT_EVENT = "StretchHouseIntentEvent"

type MoveHouseDetail = {
  delta: V3
  houseId: string
}

type MoveHouseIntentDetail = MoveHouseDetail

type StretchHouseIntentDetail = {
  houseId: string
  // look at your stretch proxies to figure this
}

export const dispatchMoveHouse = (detail: MoveHouseIntentDetail) =>
  dispatchEvent(
    new CustomEvent(MOVE_HOUSE_EVENT, {
      detail,
    })
  )

export const dispatchMoveHouseIntent = (detail: MoveHouseIntentDetail) =>
  dispatchEvent(
    new CustomEvent(MOVE_HOUSE_INTENT_EVENT, {
      detail,
    })
  )

export const useMoveHouseIntentListener = (
  f: (eventDetail: MoveHouseIntentDetail) => void
) => useEvent(MOVE_HOUSE_INTENT_EVENT, ({ detail }) => f(detail))

export const useMoveHouseListener = (
  f: (eventDetail: MoveHouseIntentDetail) => void
) => useEvent(MOVE_HOUSE_EVENT, ({ detail }) => f(detail))

export const dispatchStretchHouseIntent = (detail: StretchHouseIntentDetail) =>
  dispatchEvent(new CustomEvent(STRETCH_HOUSE_INTENT_EVENT, { detail }))

export const useStretchHouseIntentListener = (
  f: (eventDetail: StretchHouseIntentDetail) => void
) => useEvent(STRETCH_HOUSE_INTENT_EVENT, f)
