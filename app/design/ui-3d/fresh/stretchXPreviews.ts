import { Group } from "three"
import { getLayoutsWorker } from "../../../workers"
import { HouseRootGroupUserData } from "./userData"

const getStretchXPreviews = async (
  houseGroup: Group
): Promise<Record<string, Group>> => {
  const layoutsWorker = getLayoutsWorker()

  if (layoutsWorker === null)
    throw new Error(`layoutsWorker null in stretchXPreviews`)

  const previews: Record<string, Group> = {}

  const { houseId } = houseGroup.userData as HouseRootGroupUserData

  // const foo = await layoutsWorker.getStretchXPreviews(houseId)
  // console.log(foo)

  // get the dnas?
  // check old func for dnas -> new dnas

  // iter section types first

  // doesn't this go in a worker though?

  // check db

  // yeah we just need to post for layouts

  // we could post houseId, sectionType

  return previews
}

export default getStretchXPreviews
