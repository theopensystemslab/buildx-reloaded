import { pipe } from "fp-ts/lib/function"
import { Group, Plane, Vector3 } from "three"
import { T } from "../../../../utils/functions"
import { HouseTransformsGroupUserData, UserDataTypeEnum } from "../userData"
import { createHouseLayoutGroup, getHouseLayout } from "./houseLayoutGroup"

export const BIG_CLIP_NUMBER = 999

export const createHouseTransformsGroup = ({
  systemId,
  houseId,
  dnas,
  friendlyName,
  houseTypeId,
}: {
  systemId: string
  houseId: string
  dnas: string[]
  friendlyName: string
  houseTypeId: string
}): T.Task<Group> =>
  pipe(
    getHouseLayout({ systemId, dnas }),
    T.chain((houseLayout) =>
      createHouseLayoutGroup({ houseLayout, dnas, systemId, houseId })
    ),
    T.map((layoutGroup) => {
      const transformsGroup = new Group()

      const NORMAL_DIRECTION = -1

      const clippingPlanes: Plane[] = [
        new Plane(new Vector3(NORMAL_DIRECTION, 0, 0), BIG_CLIP_NUMBER),
        new Plane(new Vector3(0, NORMAL_DIRECTION, 0), BIG_CLIP_NUMBER),
        new Plane(new Vector3(0, 0, NORMAL_DIRECTION), BIG_CLIP_NUMBER),
      ]

      const houseTransformsGroupUserData: HouseTransformsGroupUserData = {
        type: UserDataTypeEnum.Enum.HouseTransformsGroup,
        systemId,
        houseId,
        clippingPlanes,
        friendlyName,
        activeLayoutUuid: layoutGroup.uuid,
        houseTypeId,
      }
      transformsGroup.userData = houseTransformsGroupUserData
      transformsGroup.add(layoutGroup)

      return transformsGroup
    })
  )
