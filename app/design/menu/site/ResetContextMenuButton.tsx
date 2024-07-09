import { Reset } from "@carbon/icons-react"
import { HouseGroup } from "@opensystemslab/buildx-core"
import { useEffect } from "react"
import ContextMenuButton from "../common/ContextMenuButton"

type Props = {
  houseGroup: HouseGroup
  close: () => void
}

const ResetContextMenuButton = ({ houseGroup, close }: Props) => {
  useEffect(() => {
    // houseGroup.refreshAltResetLayout()
  }, [])

  const resetHouse = async () => {
    // pipe(
    //   houseGroup.userData.layouts.alts,
    //   A.findFirst((x) => x.type === LayoutType.Enum.ALT_RESET),
    //   O.map((x) => {
    //     houseGroup.userData.setPreviewLayout(x)
    //     houseGroup.userData.setActiveLayout(x)
    //     houseGroup.userData.updateDB().then(() => {
    //       houseGroup.userData.refreshAltSectionTypeLayouts()
    //     })
    //   })
    // )

    close()
  }

  return (
    <ContextMenuButton
      icon={<Reset size={20} />}
      text="Reset"
      onClick={resetHouse}
    />
  )
}

export default ResetContextMenuButton
