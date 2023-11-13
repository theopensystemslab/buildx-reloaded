import { Reset } from "@carbon/icons-react"
import { pipe } from "fp-ts/lib/function"
import { useEffect } from "react"
import { A, O } from "../../../../utils/functions"
import {
  HouseTransformsGroup,
  LayoutType,
} from "../../../ui-3d/fresh/scene/userData"
import ContextMenuButton from "../common/ContextMenuButton"

type Props = {
  houseTransformsGroup: HouseTransformsGroup
  close: () => void
}

const ResetContextMenuButton = ({ houseTransformsGroup, close }: Props) => {
  useEffect(() => {
    houseTransformsGroup.userData.refreshAltResetLayout()
  }, [houseTransformsGroup.userData])

  const resetHouse = async () => {
    pipe(
      houseTransformsGroup.userData.layouts.alts,
      A.findFirst((x) => x.type === LayoutType.Enum.ALT_RESET),
      O.map((x) => {
        houseTransformsGroup.userData.setPreviewLayout(x)
        houseTransformsGroup.userData.setActiveLayout(x)
        houseTransformsGroup.userData.updateDB()
      })
    )

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
