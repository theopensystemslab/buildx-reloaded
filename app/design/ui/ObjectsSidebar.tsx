import { pipe } from "fp-ts/lib/function"
import { useAllHouseTypes } from "../../db/systems"
import Sidebar from "../../ui/Sidebar"
import { A } from "../../utils/functions"
import { setSidebar, useDesignSettings } from "../state/settings"
import HouseThumbnail from "./HouseThumbnail"

const ObjectsSidebar = () => {
  const { sidebar } = useDesignSettings()

  const close = () => void setSidebar(false)

  const houseTypes = useAllHouseTypes()

  // NOTE see old sidebar if multi-systeming
  // SiteSidebar in commit older than blame this

  return (
    <Sidebar expanded={sidebar && houseTypes.length > 0} onClose={close}>
      {pipe(
        houseTypes,
        A.map((houseType) => (
          <HouseThumbnail key={houseType.id} houseType={houseType} />
        ))
      )}
    </Sidebar>
  )
}

export default ObjectsSidebar
