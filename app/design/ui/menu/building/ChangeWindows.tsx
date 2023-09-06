import React from "react"
import { suspend } from "suspend-react"
import { ScopeElement } from "../../../state/scope"
import { getActiveHouseUserData } from "../../../ui-3d/fresh/helpers/sceneQueries"
import {
  HouseLayoutGroup,
  HouseTransformsGroup,
} from "../../../ui-3d/fresh/scene/userData"

type Props = {
  scopeElement: ScopeElement
  houseTransformsGroup: HouseTransformsGroup
  close: () => void
}

type WindowTypeOption = {
  label: string
  value: {
    windowType: WindowTypeOption
    changeForward: () => void
    changeReverse: () => void
    settle?: () => void
  }
}

const ChangeWindowsOptions = (props: Props) => {
  const { houseTransformsGroup, scopeElement, close } = props

  const {} = suspend(async () => {
    // const { systemId, houseId, dnas } =
    //   getActiveHouseUserData(houseTransformsGroup)

    // const { levelIndex, dna } = scopeElement

    // const { levelType: currentLevelTypeCode } = parseDna(dna)

    // const currentLevelType = await systemsDB.levelTypes.get({
    //   systemId,
    //   code: currentLevelTypeCode,
    // })

    // if (!currentLevelType)
    //   throw new Error(
    //     `no level type found for ${systemId} ${currentLevelTypeCode}`
    //   )

    // const activeLayoutGroup =
    //   houseTransformsGroup.userData.getActiveLayoutGroup()

    // const originalLevelTypeOption: LevelTypeOption = {
    //   label: currentLevelType.description,
    //   value: {
    //     houseLayoutGroup: activeLayoutGroup,
    //     levelType: currentLevelType,
    //   },
    // }

    // const altLevelTypeLayouts = await getLayoutsWorker().getAltLevelTypeLayouts(
    //   {
    //     systemId,
    //     dnas,
    //     currentLevelTypeCode,
    //     levelIndex,
    //   }
    // )

    // let levelTypeOptions: LevelTypeOption[] = []

    // for (let { levelType, layout, dnas } of altLevelTypeLayouts) {
    //   if (levelType.code === currentLevelTypeCode) continue

    //   createHouseLayoutGroup({
    //     systemId,
    //     dnas,
    //     houseId,
    //     houseLayout: layout,
    //     use: HouseLayoutGroupUse.Enum.ALT_LEVEL_TYPE,
    //   })().then((houseLayoutGroup) => {
    //     setInvisibleNoRaycast(houseLayoutGroup)
    //     houseTransformsGroup.add(houseLayoutGroup)
    //     const lto: LevelTypeOption = {
    //       label: levelType.description,
    //       value: { levelType, houseLayoutGroup },
    //     }
    //     levelTypeOptions.push(lto)
    //   })
    // }

    // levelTypeOptions.push(originalLevelTypeOption)

    // levelTypeOptions.sort((a, b) => {
    //   if (a.value.levelType.code > b.value.levelType.code) return 1
    //   if (a.value.levelType.code < b.value.levelType.code) return -1
    //   return 0
    // })

    // return { levelTypeOptions, originalLevelTypeOption }
    return {}
  }, [scopeElement])

  return null
}

const ChangeWindows = (props: Props) => {
  const { houseTransformsGroup, scopeElement, close } = props

  return <div></div>
}

export default ChangeWindows
