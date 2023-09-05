import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { suspend } from "suspend-react"
import Radio from "~/ui//Radio"
import { ChangeLevel } from "~/ui/icons"
import { A } from "~/utils/functions"
import { LevelType } from "../../../../../server/data/levelTypes"
import { parseDna } from "../../../../../server/data/modules"
import systemsDB from "../../../../db/systems"
import { setInvisibleNoRaycast } from "../../../../utils/three"
import { getLayoutsWorker } from "../../../../workers"
import { ScopeElement } from "../../../state/scope"
import { getActiveHouseUserData } from "../../../ui-3d/fresh/helpers/sceneQueries"
import { createHouseLayoutGroup } from "../../../ui-3d/fresh/scene/houseLayoutGroup"
import {
  HouseLayoutGroup,
  HouseLayoutGroupUse,
  HouseTransformsGroup,
  isActiveLayoutGroup,
  isHouseLayoutGroup,
} from "../../../ui-3d/fresh/scene/userData"
import ContextMenuNested from "../common/ContextMenuNested"

type Props = {
  scopeElement: ScopeElement
  houseTransformsGroup: HouseTransformsGroup
  close: () => void
}

const ChangeLevelType = ({
  houseTransformsGroup,
  scopeElement,
  close,
}: Props) => {
  type LevelTypeOption = {
    label: string
    value: { levelType: LevelType; houseLayoutGroup: HouseLayoutGroup }
  }

  const { levelTypeOptions, originalLevelTypeOption, levelString } =
    suspend(async () => {
      const { systemId, houseId, dnas } =
        getActiveHouseUserData(houseTransformsGroup)

      const { levelIndex, dna } = scopeElement

      const { levelType: currentLevelTypeCode } = parseDna(dna)

      const currentLevelType = await systemsDB.levelTypes.get({
        systemId,
        code: currentLevelTypeCode,
      })

      if (!currentLevelType)
        throw new Error(
          `no level type found for ${systemId} ${currentLevelTypeCode}`
        )

      const activeLayoutGroup =
        houseTransformsGroup.userData.getActiveLayoutGroup()

      let levelString = "level"

      if (currentLevelTypeCode?.[0] === "F") {
        levelString = "foundations"
      }
      if (currentLevelTypeCode?.[0] === "R") {
        levelString = "roof"
      }

      const originalLevelTypeOption: LevelTypeOption = {
        label: currentLevelType.description,
        value: {
          houseLayoutGroup: activeLayoutGroup,
          levelType: currentLevelType,
        },
      }

      const altLevelTypeLayouts =
        await getLayoutsWorker().getAltLevelTypeLayouts({
          systemId,
          dnas,
          currentLevelTypeCode,
          levelIndex,
        })

      let levelTypeOptions: LevelTypeOption[] = []

      for (let { levelType, layout, dnas } of altLevelTypeLayouts) {
        if (levelType.code === currentLevelTypeCode) continue

        createHouseLayoutGroup({
          systemId,
          dnas,
          houseId,
          houseLayout: layout,
          use: HouseLayoutGroupUse.Enum.ALT_LEVEL_TYPE,
        })().then((houseLayoutGroup) => {
          setInvisibleNoRaycast(houseLayoutGroup)
          houseTransformsGroup.add(houseLayoutGroup)
          const lto: LevelTypeOption = {
            label: levelType.description,
            value: { levelType, houseLayoutGroup },
          }
          levelTypeOptions.push(lto)
        })
      }

      levelTypeOptions.push(originalLevelTypeOption)

      levelTypeOptions.sort((a, b) => {
        if (a.value.levelType.code > b.value.levelType.code) return 1
        if (a.value.levelType.code < b.value.levelType.code) return -1
        return 0
      })

      return { levelTypeOptions, originalLevelTypeOption, levelString }
    }, [scopeElement])

  const cleanup = () =>
    pipe(
      houseTransformsGroup.children,
      A.filter(
        (x) =>
          isHouseLayoutGroup(x) &&
          x.userData.use === HouseLayoutGroupUse.Enum.ALT_LEVEL_TYPE &&
          !isActiveLayoutGroup(x)
      ),
      A.map((x) => {
        x.removeFromParent()
      })
    )

  const closing = useRef(false)

  const previewLevelType = (incoming: LevelTypeOption["value"] | null) => {
    if (closing.current) return

    if (incoming) {
      houseTransformsGroup.userData.setActiveLayoutGroup(
        incoming.houseLayoutGroup
      )
    } else {
      houseTransformsGroup.userData.setActiveLayoutGroup(
        originalLevelTypeOption.value.houseLayoutGroup
      )
    }
    invalidate()
  }

  const changeLevelType = ({ houseLayoutGroup }: LevelTypeOption["value"]) => {
    closing.current = true
    houseTransformsGroup.userData.dbSync().then(() => {
      houseTransformsGroup.userData.refreshAltSectionTypeLayouts()
    })
    close()
  }

  return (
    <ContextMenuNested
      long
      label={`Change ${levelString} type`}
      icon={<ChangeLevel />}
      unpaddedSvg
    >
      <Radio
        options={levelTypeOptions}
        selected={originalLevelTypeOption.value}
        onChange={changeLevelType}
        onHoverChange={previewLevelType}
      />
    </ContextMenuNested>
  )
}

export default ChangeLevelType
