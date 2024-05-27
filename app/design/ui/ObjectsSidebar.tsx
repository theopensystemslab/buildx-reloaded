import { pipe } from "fp-ts/lib/function"
import { useAllHouseTypes } from "../../db/systems"
import Sidebar from "../../ui/Sidebar"
import { A, E } from "../../utils/functions"
import { setSidebar, useDesignSettings } from "../state/settings"
import HouseThumbnail from "./HouseThumbnail"
import { cachedHouseTypesTE } from "@opensystemslab/buildx-core"
import { suspend } from "suspend-react"
import { Fragment, Suspense } from "react"
import Loader from "~/ui/Loader"

const HouseTypes = () => (
  <Fragment>
    {pipe(
      cachedHouseTypesTE,
      suspend,
      E.match(
        () => null,
        A.map((houseType) => (
          <HouseThumbnail key={houseType.id} houseType={houseType} />
        ))
      )
    )}
  </Fragment>
)

const ObjectsSidebar = () => {
  const { sidebar } = useDesignSettings()

  const close = () => void setSidebar(false)

  // NOTE see old sidebar if multi-systeming
  // SiteSidebar in commit older than blame this

  return (
    <Sidebar expanded={sidebar} onClose={close}>
      <Suspense fallback={<Loader />}>
        <HouseTypes />
      </Suspense>
    </Sidebar>
  )
}

export default ObjectsSidebar
