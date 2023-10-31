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
  LayoutType,
  GridGroup,
  HouseLayoutGroup,
  HouseTransformsGroup,
  isAltLevelTypeLayout,
  isGridGroup,
  isModuleGroup,
  Layout,
  AltLevelTypeLayout,
  isActiveLayout,
} from "../../../ui-3d/fresh/scene/userData"
import ContextMenuNested from "../common/ContextMenuNested"

type Props = {
  scopeElement: ScopeElement
  houseTransformsGroup: HouseTransformsGroup
  close: () => void
}

type LevelTypeOption = {
  label: string
  value: { levelType: LevelType; layout: Layout }
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
    close,
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
    const { levelIndex, dna } = scopeElement
    const { layouts } = houseTransformsGroup.userData

    const { levelType: thisLevelTypeCode } = parseDna(dna)

    const altLevelLayoutToOpt = (
      layout: AltLevelTypeLayout
    ): LevelTypeOption => {
      const {
        levelType,
        levelType: { description: label },
      } = layout

      return {
        label,
        value: { layout, levelType },
      }
    }

    return pipe(
      levelTypes,
      A.findFirst((x) => x.code === thisLevelTypeCode),
      O.map((levelType) => {
        const originalOption: LevelTypeOption = {
          label: levelType.description,
          value: {
            layout: layouts.active,
            levelType,
          },
        }

        const newOptions = pipe(
          layouts.alts,
          A.filter(isAltLevelTypeLayout),
          A.map(altLevelLayoutToOpt)
        )

        const allOptions = pipe(
          [...newOptions, originalOption],
          A.uniq({
            equals: (x, y) =>
              x.value.layout.houseLayoutGroup.uuid ===
              y.value.layout.houseLayoutGroup.uuid,
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
      }),
      O.getOrElse(
        (): {
          levelTypeOptions: LevelTypeOption[]
          originalLevelTypeOption: LevelTypeOption | null
        } => ({
          levelTypeOptions: [],
          originalLevelTypeOption: null,
        })
      )
    )
  }, [houseTransformsGroup.userData, levelTypes, scopeElement])

  const previewLevelType = (incoming: LevelTypeOption["value"] | null) => {
    const { setPreviewLayout } = houseTransformsGroup.userData

    if (incoming) {
      if (!isActiveLayout(incoming.layout)) {
        setPreviewLayout(incoming.layout)
      }
    } else {
      setPreviewLayout(null)
    }

    invalidate()
  }

  const changeLevelType = ({ layout }: LevelTypeOption["value"]) => {
    const { setActiveLayout, setPreviewLayout, updateDB } =
      houseTransformsGroup.userData

    if (!isActiveLayout(layout)) {
      setActiveLayout(layout)
    }

    setPreviewLayout(null)

    updateDB().then(() => {
      houseTransformsGroup.userData.refreshAltSectionTypeLayouts()
      houseTransformsGroup.userData.switchHandlesVisibility("STRETCH")
    })

    close()
  }

  return originalLevelTypeOption !== null && levelTypeOptions.length > 1 ? (
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
