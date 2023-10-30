import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useMemo, useRef } from "react"
import Radio from "~/ui//Radio"
import { ChangeLevel } from "~/ui/icons"
import { A, O, someOrError } from "~/utils/functions"
import { LevelType } from "../../../../../server/data/levelTypes"
import { parseDna } from "../../../../../server/data/modules"
import { useAllLevelTypes } from "../../../../db/systems"
import { ScopeElement } from "../../../state/scope"
import { findFirstGuardDown } from "../../../ui-3d/fresh/helpers/sceneQueries"
import {
  AltLayoutGroupType,
  GridGroup,
  HouseLayoutGroup,
  HouseTransformsGroup,
  isGridGroup,
  isModuleGroup,
} from "../../../ui-3d/fresh/scene/userData"
import ContextMenuNested from "../common/ContextMenuNested"

type Props = {
  scopeElement: ScopeElement
  houseTransformsGroup: HouseTransformsGroup
  close: () => void
}

type LevelTypeOption = {
  label: string
  value: { levelType: LevelType; layoutGroup: HouseLayoutGroup }
}

// const ChangeLevelTypeOptions = (props: Props & { levelTypes: LevelType[] }) => {
//   const { houseTransformsGroup, scopeElement, close, levelTypes } = props

//   const { levelTypeOptions, originalLevelTypeOption } = useMemo(() => {
//     const { levelIndex } = scopeElement

//     const getLevelType = (code: string) =>
//       pipe(
//         levelTypes,
//         A.findFirst((x) => x.code === code),
//         someOrError(`level type ${code} not found`)
//       )

//     const augmentLevelType = (
//       layoutGroup: HouseLayoutGroup
//     ): LevelTypeOption => {
//       const moduleGroup = pipe(
//         layoutGroup,
//         findFirstGuardDown(
//           (x): x is GridGroup =>
//             isGridGroup(x) && x.userData.levelIndex === levelIndex
//         ),
//         someOrError(`no grid group`),
//         findFirstGuardDown(isModuleGroup),
//         someOrError(`no module group`)
//       )

//       const { levelType: code } = parseDna(moduleGroup.userData.dna)

//       const levelType = getLevelType(code)

//       return {
//         label: levelType.description,
//         value: {
//           layoutGroup,
//           levelType,
//         },
//       }
//     }

//     const newOptions = pipe(
//       houseTransformsGroup.userData.layouts.alts,
//       A.filterMap(({ type, houseLayoutGroup }) =>
//         type === AltLayoutGroupType.Enum.ALT_LEVEL_TYPE
//           ? O.some(houseLayoutGroup)
//           : O.none
//       ),
//       A.map(augmentLevelType)
//     )

//     const originalOption = augmentLevelType(
//       houseTransformsGroup.userData.getActiveLayoutGroup()
//     )

//     const allOptions = pipe(
//       [...newOptions, originalOption],
//       A.uniq({
//         equals: (x, y) => x.value.layoutGroup.uuid === y.value.layoutGroup.uuid,
//       })
//     )

//     allOptions.sort((a, b) => {
//       if (a.value.levelType.code > b.value.levelType.code) return 1
//       if (a.value.levelType.code < b.value.levelType.code) return -1
//       return 0
//     })

//     return {
//       levelTypeOptions: allOptions,
//       originalLevelTypeOption: originalOption,
//     }
//   }, [
//     houseTransformsGroup.children,
//     houseTransformsGroup.userData,
//     levelTypes,
//     scopeElement,
//   ])

//   return null
// }

const ChangeLevelType = (props: Props) => {
  const {
    scopeElement,
    scopeElement: { dna },
    houseTransformsGroup,
  } = props

  const levelTypes = useAllLevelTypes().filter(
    (x) => x.systemId === houseTransformsGroup.userData.systemId
  )

  const { levelType } = parseDna(dna)

  let levelString = "level"

  if (levelType[0] === "F") {
    levelString = "foundations"
  }

  if (levelType[0] === "R") {
    levelString = "roof"
  }

  const { levelTypeOptions, originalLevelTypeOption } = useMemo(() => {
    const { levelIndex } = scopeElement

    const getLevelType = (code: string) =>
      pipe(
        levelTypes,
        A.findFirst((x) => x.code === code),
        someOrError(`level type ${code} not found`)
      )

    const augmentLevelType = (
      layoutGroup: HouseLayoutGroup
    ): LevelTypeOption => {
      const moduleGroup = pipe(
        layoutGroup,
        findFirstGuardDown(
          (x): x is GridGroup =>
            isGridGroup(x) && x.userData.levelIndex === levelIndex
        ),
        someOrError(`no grid group`),
        findFirstGuardDown(isModuleGroup),
        someOrError(`no module group`)
      )

      const { levelType: code } = parseDna(moduleGroup.userData.dna)

      const levelType = getLevelType(code)

      return {
        label: levelType.description,
        value: {
          layoutGroup,
          levelType,
        },
      }
    }

    const newOptions = pipe(
      houseTransformsGroup.userData.layouts.alts,
      A.filterMap(({ type, houseLayoutGroup }) =>
        type === AltLayoutGroupType.Enum.ALT_LEVEL_TYPE
          ? O.some(houseLayoutGroup)
          : O.none
      ),
      A.map(augmentLevelType)
    )

    const originalOption = augmentLevelType(
      houseTransformsGroup.userData.getActiveLayoutGroup()
    )

    const allOptions = pipe(
      [...newOptions, originalOption],
      A.uniq({
        equals: (x, y) => x.value.layoutGroup.uuid === y.value.layoutGroup.uuid,
      })
    )

    allOptions.sort((a, b) => {
      if (a.value.levelType.code > b.value.levelType.code) return 1
      if (a.value.levelType.code < b.value.levelType.code) return -1
      return 0
    })

    return {
      levelTypeOptions: allOptions,
      originalLevelTypeOption: originalOption,
    }
  }, [
    houseTransformsGroup.children,
    houseTransformsGroup.userData,
    levelTypes,
    scopeElement,
  ])

  const locked = useRef(false)

  useEffect(() => {
    locked.current = false
  }, [])

  const previewLevelType = (incoming: LevelTypeOption["value"] | null) => {
    if (locked.current) return

    if (incoming) {
      houseTransformsGroup.userData.setActiveLayoutGroup(incoming.layoutGroup)
    } else {
      houseTransformsGroup.userData.setActiveLayoutGroup(
        originalLevelTypeOption.value.layoutGroup
      )
    }

    invalidate()
  }

  const changeLevelType = ({ layoutGroup }: LevelTypeOption["value"]) => {
    locked.current = true

    houseTransformsGroup.userData.setActiveLayoutGroup(layoutGroup)

    // close()

    houseTransformsGroup.userData.updateDB().then(() => {
      // pipe(
      //   houseTransformsGroup.children,
      //   A.filter(
      //     (x) =>
      //       isHouseLayoutGroup(x) &&
      //       x.userData.use === HouseLayoutGroupUse.Enum.ALT_LEVEL_TYPE
      //   ),
      //   A.map((x) => {
      //     x.removeFromParent()
      //   })
      // )
      houseTransformsGroup.userData.refreshAltSectionTypeLayouts()
      houseTransformsGroup.userData.switchHandlesVisibility("STRETCH")
    })

    close()
    // closing.current = false
  }
  return levelTypeOptions.length > 1 ? (
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
  ) : null
}

export default ChangeLevelType
