import { Reset } from "@carbon/icons-react"
import { flow, pipe } from "fp-ts/lib/function"
import { useEffect, useRef } from "react"
import systemsDB from "../../../../db/systems"
import { A, O, T } from "../../../../utils/functions"
import { setInvisibleNoRaycast } from "../../../../utils/three"
import { getLayoutsWorker } from "../../../../workers"
import { createHouseLayoutGroup } from "../../../ui-3d/fresh/scene/houseLayoutGroup"
import {
  HouseLayoutGroup,
  HouseTransformsGroup,
  isHouseLayoutGroup,
} from "../../../ui-3d/fresh/scene/userData"
import ContextMenuButton from "../common/ContextMenuButton"

type Props = {
  houseTransformsGroup: HouseTransformsGroup
  close: () => void
}

const ResetContextMenuButton = ({ houseTransformsGroup, close }: Props) => {
  const RESET_TARGET_NAME = "RESET_TARGET_NAME"

  const resetLayoutGroupRef = useRef<HouseLayoutGroup | null>(null)

  useEffect(() => {
    const initReset = async () => {
      const { systemId, houseId, houseTypeId } = houseTransformsGroup.userData

      const houseTypeTask = () => systemsDB.houseTypes.get(houseTypeId)

      const { getLayout } = getLayoutsWorker()

      const houseLayoutGroupTask = pipe(
        houseTypeTask,
        T.chain(
          flow(
            O.fromNullable,
            O.fold(
              () => () => Promise.reject(),
              ({ dnas }) =>
                pipe(
                  () => getLayout({ systemId, dnas }),
                  T.chain((houseLayout) =>
                    createHouseLayoutGroup({
                      systemId,
                      houseId,
                      dnas,
                      houseLayout,
                      creator: `ResetContextMenuButton`,
                    })
                  )
                )
            )
          )
        )
      )

      houseLayoutGroupTask().then((houseLayoutGroup) => {
        pipe(
          houseTransformsGroup.children,
          A.findFirst(
            (child) =>
              isHouseLayoutGroup(child) && child.name === RESET_TARGET_NAME
          ),
          O.map((node) => void node.removeFromParent())
        )

        setInvisibleNoRaycast(houseLayoutGroup)
        houseLayoutGroup.name = RESET_TARGET_NAME

        houseTransformsGroup.add(houseLayoutGroup)

        resetLayoutGroupRef.current = houseLayoutGroup
      })
    }

    initReset()

    return () => {
      if (resetLayoutGroupRef.current) {
        houseTransformsGroup.remove(resetLayoutGroupRef.current)
      }
    }
  }, [houseTransformsGroup])

  const resetHouse = async () => {
    if (resetLayoutGroupRef.current) {
      console.log(houseTransformsGroup)
      houseTransformsGroup.userData.setActiveLayoutGroup(
        resetLayoutGroupRef.current
      )
      houseTransformsGroup.userData.dbSync()
      close()
    }
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
