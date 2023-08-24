import { pipe } from "fp-ts/lib/function"
import { A, O } from "../../../../utils/functions"
import {
  setInvisibleNoRaycast,
  setVisibleAndRaycast,
} from "../../../../utils/three"
import { HouseTransformsGroup } from "../scene/userData"
import { getPartitionedLayoutGroups } from "./sceneQueries"

export const debugNextLayout = (houseTransformsGroup: HouseTransformsGroup) => {
  const { activeLayoutGroup, otherLayoutGroups } =
    getPartitionedLayoutGroups(houseTransformsGroup)

  pipe(
    otherLayoutGroups,
    A.head,
    O.map((nextLayout) => {
      setVisibleAndRaycast(nextLayout)
      setInvisibleNoRaycast(activeLayoutGroup)
      houseTransformsGroup.userData.activeLayoutGroupUuid = nextLayout.uuid
    })
  )
}
