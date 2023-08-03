import { pipe } from "fp-ts/lib/function"
import { Group } from "three"
import { A, O } from "../../../../utils/functions"
import { setInvisible, setVisibleAndRaycast } from "../../../../utils/three"
import { getPartitionedLayoutGroups } from "./sceneQueries"

export const debugNextLayout = (houseTransformsGroup: Group) => {
  const {
    left: rest,
    right: [active],
  } = getPartitionedLayoutGroups(houseTransformsGroup)

  pipe(
    rest,
    A.head,
    O.map((nextLayout) => {
      setVisibleAndRaycast(nextLayout)
      console.log({ active })
      setInvisible(active)
      houseTransformsGroup.userData.activeChildUuid = nextLayout.uuid
    })
  )
}
