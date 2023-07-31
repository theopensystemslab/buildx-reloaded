import { pipe } from "fp-ts/lib/function"
import { RefObject } from "react"
import { Group, Object3D } from "three"
import { A, O } from "../../../utils/functions"
import { UserDataTypeEnum } from "./userData"

const getUtils = (rootRef: RefObject<Group>) => {
  const applyToHouseRootGroup = (
    houseId: string,
    f: (object: Object3D) => void
  ) =>
    pipe(
      rootRef.current?.children ?? [],
      A.findFirst(
        ({ userData }) =>
          userData.type === UserDataTypeEnum.Enum.HouseRootGroup &&
          userData.houseId === houseId
      ),
      O.map(f)
    )

  return {
    applyToHouseRootGroup,
  }
}

export default getUtils
