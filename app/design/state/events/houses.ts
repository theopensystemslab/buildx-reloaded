import { useEvent } from "react-use"
import { HouseType } from "../../../../server/data/houseTypes"
import { House } from "../../../db/user"

const ADD_HOUSE_INTENT_EVENT = "AddHouseIntentEvent"
const ADD_HOUSE_EVENT = "AddHouseEvent"

export const dispatchAddHouseIntent = (detail: HouseType) =>
  dispatchEvent(
    new CustomEvent(ADD_HOUSE_INTENT_EVENT, {
      detail,
    })
  )

export const useAddHouseIntentListener = (
  f: (eventDetail: HouseType) => void
) => useEvent(ADD_HOUSE_INTENT_EVENT, ({ detail }) => f(detail))

export const dispatchAddHouse = (detail: House) =>
  dispatchEvent(
    new CustomEvent(ADD_HOUSE_EVENT, {
      detail,
    })
  )

export const useAddHouseListener = (f: (eventDetail: House) => void) =>
  useEvent(ADD_HOUSE_EVENT, ({ detail }) => f(detail))
