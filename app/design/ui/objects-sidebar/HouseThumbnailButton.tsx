import { CachedHouseType, houseGroupTE } from "@opensystemslab/buildx-core"
import clsx from "clsx"
import { pipe } from "fp-ts/lib/function"
import { getBuildXScene } from "~/design/app"
import { TE } from "~/utils/functions"

const HouseThumbnailButton = ({
  houseType,
  close,
}: {
  houseType: CachedHouseType
  close: () => void
}) => {
  const { dnas, id: houseTypeId, systemId } = houseType

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
        close()
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
