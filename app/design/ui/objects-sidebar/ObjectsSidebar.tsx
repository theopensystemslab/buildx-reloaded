import { cachedHouseTypesTE } from "@opensystemslab/buildx-core"
import { pipe } from "fp-ts/lib/function"
import { Fragment, Suspense } from "react"
import { suspend } from "suspend-react"
import Loader from "~/ui/Loader"
import HouseThumbnail from "./HouseThumbnail"
import { A, E } from "~/utils/functions"
import Sidebar from "~/ui/Sidebar"

const HouseTypes = (props: { close: () => void }) => {
  const { close } = props
  return (
    <Fragment>
      {pipe(
        cachedHouseTypesTE,
        suspend,
        E.match(
          () => null,
          A.map((houseType) => (
            <HouseThumbnail
              key={houseType.id}
              houseType={houseType}
              close={close}
            />
          ))
        )
      )}
    </Fragment>
  )
}

type Props = {
  expanded: boolean
  close: () => void
}

const ObjectsSidebar = (props: Props) => {
  const { expanded, close } = props

  // NOTE see old sidebar if multi-systeming
  // SiteSidebar in commit older than blame this

  return (
    <Sidebar expanded={expanded} onClose={close}>
      <Suspense fallback={<Loader />}>
        <HouseTypes close={close} />
      </Suspense>
    </Sidebar>
  )
}

export default ObjectsSidebar
