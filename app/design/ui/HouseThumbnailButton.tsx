import React, { useEffect } from "react"
import type { HouseGroup } from "@opensystemslab/buildx-core"
import { CachedHouseType, houseGroupTE } from "@opensystemslab/buildx-core"
import { nanoid } from "nanoid"
import { pipe } from "fp-ts/lib/function"
import clsx from "clsx"
import { O, R, TE } from "~/utils/functions"
import { getBuildXScene } from "../app"

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
        friendlyName: "",
        houseId: nanoid(),
        houseTypeId,
      }),
      TE.map((houseGroup) => {
        scene.addHouseGroup(houseGroup)
      })
    )()

    // pipe(
    //   templates,
    //   R.lookup(houseTypeId),
    //   O.map((template) => {
    //     // clone called here
    //     console.log({ foo: template.layoutsManager.activeLayoutGroup })
    //     const clone = template.clone()

    //     clone.userData.houseId = nanoid()
    //     clone.userData.friendlyName = ""

    //     scene.addHouseGroup(clone)
    //   })
    // )
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
