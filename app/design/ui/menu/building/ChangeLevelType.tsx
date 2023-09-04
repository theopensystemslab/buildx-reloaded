import { pipe } from "fp-ts/lib/function"
import { useEffect, useRef, useState } from "react"
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
  // onChange?: () => void
}

const ChangeLevelType = ({ houseTransformsGroup, scopeElement }: Props) => {
  const { levelIndex, dna } = scopeElement
  const { systemId, houseId, dnas } =
    getActiveHouseUserData(houseTransformsGroup)

  type LevelTypeOption = {
    label: string
    value: { levelType: LevelType; houseLayoutGroup: HouseLayoutGroup }
  }

  const [levelTypeOptions, setLevelTypeOptions] = useState<LevelTypeOption[]>(
    []
  )

  const [selectedLevelType, setSelectedLevelTypeOption] =
    useState<LevelTypeOption | null>(null)

  const [levelString, setLevelString] = useState("level")

  const originalHouseLayoutGroup = useRef<HouseLayoutGroup | null>(null)

  useEffect(() => {
    const initChangeLevelType = async () => {
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

      originalHouseLayoutGroup.current = activeLayoutGroup

      setSelectedLevelTypeOption({
        label: currentLevelType.description,
        value: {
          houseLayoutGroup: activeLayoutGroup,
          levelType: currentLevelType,
        },
      })

      if (currentLevelTypeCode?.[0] === "F") {
        setLevelString("foundations")
      }
      if (currentLevelTypeCode?.[0] === "R") {
        setLevelString("roof")
      }

      const altLevelTypeLayouts =
        await getLayoutsWorker().getAltLevelTypeLayouts({
          systemId,
          dnas,
          currentLevelTypeCode,
          levelIndex,
        })

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
          setLevelTypeOptions([
            ...levelTypeOptions,
            {
              label: levelType.description,
              value: { levelType, houseLayoutGroup },
            },
          ])
        })
      }
    }

    initChangeLevelType()

    return () => {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dna,
    dnas,
    houseId,
    houseTransformsGroup,
    levelIndex,
    // levelTypeOptions,
    systemId,
  ])

  const canChangeLevelType = levelTypeOptions.length > 0

  const previewLevelType = (incoming: LevelTypeOption["value"] | null) => {
    console.log(0)
    if (incoming === null) {
      if (originalHouseLayoutGroup.current) {
        console.log(1)
        houseTransformsGroup.userData.setActiveLayoutGroup(
          originalHouseLayoutGroup.current
        )
      }
    } else {
      console.log(2)
      const { houseLayoutGroup } = incoming
      houseTransformsGroup.userData.setActiveLayoutGroup(houseLayoutGroup)
    }
  }

  const changeLevelType = ({ houseLayoutGroup }: LevelTypeOption["value"]) => {
    close()
  }

  return selectedLevelType !== null && canChangeLevelType ? (
    <ContextMenuNested
      long
      label={`Change ${levelString} type`}
      icon={<ChangeLevel />}
      unpaddedSvg
    >
      <Radio
        options={[...levelTypeOptions, selectedLevelType].sort((a, b) => {
          if (a.value.levelType.code > b.value.levelType.code) return 1
          if (a.value.levelType.code < b.value.levelType.code) return -1
          return 0
        })}
        selected={selectedLevelType.value}
        onChange={changeLevelType}
        onHoverChange={previewLevelType}
      />
    </ContextMenuNested>
  ) : null
}

export default ChangeLevelType
