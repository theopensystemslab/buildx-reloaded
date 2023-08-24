import { useEvent } from "react-use"

const MOVE_HOUSE_INTENT_EVENT = "MoveHouseIntentEvent"
const MOVE_HOUSE_EVENT = "MoveHouseEvent"

const ROTATE_HOUSE_EVENT = "RotateHouseEvent"
const ROTATE_HOUSE_INTENT_EVENT = "RotateHouseIntentEvent"

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
