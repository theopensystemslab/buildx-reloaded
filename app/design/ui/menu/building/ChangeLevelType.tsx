import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Suspense, useCallback, useEffect, useRef } from "react"
import { suspend } from "suspend-react"
import Radio from "~/ui//Radio"
import { ChangeLevel } from "~/ui/icons"
import { A, pipeLog, someOrError } from "~/utils/functions"
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

type LevelTypeOption = {
  label: string
  value: { levelType: LevelType; houseLayoutGroup: HouseLayoutGroup }
}

const ChangeLevelTypeOptions = (props: Props) => {
  const { houseTransformsGroup, scopeElement, close } = props

  const { levelTypeOptions, originalLevelTypeOption } = suspend(async () => {
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

    const activeLayoutGroup = pipe(
      houseTransformsGroup.userData.getActiveLayoutGroup(),
      someOrError(`no active layout group in change level type`)
    )

    const originalLevelTypeOption: LevelTypeOption = {
      label: currentLevelType.description,
      value: {
        houseLayoutGroup: activeLayoutGroup,
        levelType: currentLevelType,
      },
    }

    const altLevelTypeLayouts = await getLayoutsWorker().getAltLevelTypeLayouts(
      {
        systemId,
        dnas,
        currentLevelTypeCode,
        levelIndex,
      }
    )

    let levelTypeOptions: LevelTypeOption[] = []

    for (let { levelType, layout, dnas } of altLevelTypeLayouts) {
      if (levelType.code === currentLevelTypeCode) continue

      createHouseLayoutGroup({
        systemId,
        dnas,
        houseId,
        houseLayout: layout,
        use: HouseLayoutGroupUse.Enum.ALT_LEVEL_TYPE,
        houseTransformsGroup,
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

    return { levelTypeOptions, originalLevelTypeOption }
  }, [scopeElement])

  const closing = useRef(false)

  const previewLevelType = (incoming: LevelTypeOption["value"] | null) => {
    if (closing.current) return

    console.log(`PREVIEW LEVEL TYPE`, incoming)

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
    console.log(`CHANGE LEVEL TYPE`)
    closing.current = true

    houseTransformsGroup.userData.updateDB().then(() => {
      houseTransformsGroup.userData.refreshAltSectionTypeLayouts()
    })

    close()

    closing.current = false
  }

  return (
    <Radio
      options={levelTypeOptions}
      selected={originalLevelTypeOption.value}
      onChange={changeLevelType}
      onHoverChange={previewLevelType}
    />
  )
}

const ChangeLevelType = (props: Props) => {
  const {
    scopeElement: { dna },
    houseTransformsGroup,
  } = props

  const alts = pipe(
    houseTransformsGroup.children,
    A.filter(
      (x): x is HouseLayoutGroup =>
        isHouseLayoutGroup(x) &&
        x.userData.use === HouseLayoutGroupUse.Enum.ALT_LEVEL_TYPE
    )
  )

  // infer the detail (level type) from
  // the current level type at level index in this layout

  const active = houseTransformsGroup.userData.unsafeGetActiveLayoutGroup()

  const allTogetherNow = pipe(
    [...alts, active],
    A.uniq({ equals: (x, y) => x.uuid === y.uuid })
  )

  const { levelType } = parseDna(dna)

  let levelString = "level"

  if (levelType[0] === "F") {
    levelString = "foundations"
  }

  if (levelType[0] === "R") {
    levelString = "roof"
  }

  // const cleanup = useCallback(() => {
  //   pipe(
  //     houseTransformsGroup.children,
  //     A.filter(
  //       (x) =>
  //         isHouseLayoutGroup(x) &&
  //         x.userData.use === HouseLayoutGroupUse.Enum.ALT_LEVEL_TYPE &&
  //         !isActiveLayoutGroup(x)
  //     ),
  //     A.map((x) => {
  //       x.removeFromParent()
  //     })
  //   )
  // }, [houseTransformsGroup])

  // useEffect(() => cleanup, [cleanup])

  return (
    <ContextMenuNested
      long
      label={`Change ${levelString} type`}
      icon={<ChangeLevel />}
      unpaddedSvg
    >
      {/* <Suspense fallback={null}>
        <ChangeLevelTypeOptions {...props} />
      </Suspense> */}
    </ContextMenuNested>
  )
}

export default ChangeLevelType
