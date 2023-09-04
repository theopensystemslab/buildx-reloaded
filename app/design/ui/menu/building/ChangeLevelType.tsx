import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useRef, useState } from "react"
import { suspend } from "suspend-react"
import { useDebouncedCallback } from "use-debounce"
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

const ChangeLevelType = ({ houseTransformsGroup, scopeElement }: Props) => {
  const { levelIndex, dna } = scopeElement
  const { systemId, houseId, dnas } =
    getActiveHouseUserData(houseTransformsGroup)

  type LevelTypeOption = {
    label: string
    value: { levelType: LevelType; houseLayoutGroup: HouseLayoutGroup }
  }

  const { levelTypeOptions, selectedLevelTypeOption, levelString } =
    suspend(async () => {
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

      const selectedLevelTypeOption: LevelTypeOption = {
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

      levelTypeOptions.push(selectedLevelTypeOption)

      levelTypeOptions.sort((a, b) => {
        if (a.value.levelType.code > b.value.levelType.code) return 1
        if (a.value.levelType.code < b.value.levelType.code) return -1
        return 0
      })

      return { levelTypeOptions, selectedLevelTypeOption, levelString }
    }, [])

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

  const previewLevelType = (incoming: LevelTypeOption["value"] | null) => {
    if (incoming) {
      houseTransformsGroup.userData.setActiveLayoutGroup(
        incoming.houseLayoutGroup
      )
      console.log(
        `changing to ${incoming.houseLayoutGroup.uuid} ${incoming.houseLayoutGroup.userData.use}`
      )
      invalidate()
    }
  }

  const changeLevelType = ({ houseLayoutGroup }: LevelTypeOption["value"]) => {
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
        selected={selectedLevelTypeOption.value}
        onChange={changeLevelType}
        onHoverChange={previewLevelType}
      />
    </ContextMenuNested>
  )
}

export default ChangeLevelType
