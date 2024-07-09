import { CachedHouseType, houseGroupTE } from "@opensystemslab/buildx-core"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import { nanoid } from "nanoid"
import { TE } from "~/utils/functions"
import { getBuildXScene } from "../app"
import { setSidebar } from "../state/settings"

// const templates: Record<string, HouseGroup> = {}

// const initTemplate = (houseType: CachedHouseType) => {
//   const { dnas, id: houseTypeId, systemId } = houseType

// }

const HouseThumbnailButton = ({
  houseType,
}: {
  houseType: CachedHouseType
}) => {
  const { dnas, id: houseTypeId, systemId } = houseType

  // useEffect(() => initTemplate(houseType), [houseType])

  const addHouse = () => {
    const scene = getBuildXScene()

    if (!scene) return

    pipe(
      houseGroupTE({
        systemId,
        dnas,
        houseTypeId,
      }),
      TE.map((houseGroup) => {
        scene.addHouseGroup(houseGroup)
        setSidebar(false)
      })
    )()
  }

  const illuminate = true

  return (
    <button
      onClick={addHouse}
      className={clsx(
        "rounded px-3 py-1 text-sm text-white transition-colors duration-200 ease-in-out hover:bg-black",
        {
          ["bg-grey-80"]: illuminate,
          ["bg-grey-30"]: !illuminate,
        }
      )}
    >
      Add to site
    </button>
  )
}

export default HouseThumbnailButton
