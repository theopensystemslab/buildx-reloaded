// @ts-nocheck
import { ScopeElement } from "@opensystemslab/buildx-core"
import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import React, { useEffect, useMemo, useState } from "react"
import { LevelType } from "../../../../server/data/levelTypes"
import { parseDna } from "../../../../server/data/modules"
import { useAllLevelTypes } from "../../../db/systems"
import Radio from "../../../ui/Radio"
import { ChangeLevel } from "../../../ui/icons"
import { A, O, T } from "../../../utils/functions"
import { getLayoutsWorker } from "../../../workers"
import { createHouseLayoutGroup } from "../../ui-3d/fresh/scene/houseLayoutGroup"
import {
  AltLevelTypeLayout,
  Layout,
  LayoutType,
  isActiveLayout,
} from "../../ui-3d/fresh/scene/userData"
import ContextMenuNested from "../common/ContextMenuNested"

type Props = {
  scopeElement: ScopeElement
  close: () => void
}

type LevelTypeOption = {
  label: string
  value: { levelType: LevelType; layout: Layout }
}

const ChangeLevelType = (props: Props) => {
  const {
    scopeElement,
    scopeElement: { dna, rowIndex },
    close,
  } = props

  const houseGroup = scopeElement.elementGroup.houseGroup
  const { systemId, houseId } = houseGroup.userData
  const { dnas } = houseGroup.activeLayoutGroup.userData

  const { levelType: currentLevelTypeCode } = parseDna(dna)

  const allLevelTypes = useAllLevelTypes()

  const [altOpts, setAltOpts] = useState<LevelTypeOption[]>([])

  const origOpt = useMemo(
    (): O.Option<LevelTypeOption> =>
      pipe(
        allLevelTypes,
        A.findFirst(({ code }) => code === currentLevelTypeCode),
        O.map((levelType) => ({
          label: levelType.description,
          value: {
            layout: houseGroup.activeLayoutGroup.userData.layout,
            levelType,
          },
        }))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allLevelTypes, houseGroup.userData, currentLevelTypeCode]
  )

  useEffect(() => {
    pipe(
      () =>
        getLayoutsWorker().getAltLevelTypeLayouts({
          systemId,
          dnas,
          currentLevelTypeCode,
          levelIndex: rowIndex,
        }),
      T.chain((altLevelTypeLayouts) =>
        pipe(
          altLevelTypeLayouts,
          A.traverse(T.ApplicativeSeq)(
            ({ levelType, dnas, layout: houseLayout }) =>
              pipe(
                createHouseLayoutGroup({
                  systemId,
                  dnas,
                  houseId,
                  houseLayout,
                  houseTransformsGroup: houseGroup,
                }),
                T.map((houseLayoutGroup): LevelTypeOption => {
                  const layout: AltLevelTypeLayout = {
                    houseLayoutGroup,
                    // windowType,
                    type: LayoutType.Enum.ALT_LEVEL_TYPE,
                    target: scopeElement,
                    levelType,
                  }

                  houseGroup.userData.pushAltLayout(layout)

                  return {
                    label: levelType.description,
                    value: {
                      layout,
                      levelType,
                    },
                  }
                })
              )
          )
        )
      )
    )().then((altOpts) => {
      // console.log({ altWinTypeOpts })
      setAltOpts(altOpts)
    })

    return () => {
      houseGroup.userData.dropAltLayoutsByType(LayoutType.Enum.ALT_LEVEL_TYPE)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dnas, houseId, rowIndex, scopeElement, systemId])
  //       const originalOption: LevelTypeOption =
  // const origLevelTypeOpt = useMemo((): O.Option<LevelTypeOption> =>
  // pipe(allLevelTypes, A.findFirst(({})=> levelType. {

  // }))
  // )

  const levelString = pipe(
    origOpt,
    O.match(
      () => "level height",
      ({
        value: {
          levelType: { code },
        },
      }) => {
        let levelString = "level height"

        if (code[0] === "F") {
          levelString = "foundations type"
        }

        if (code[0] === "R") {
          levelString = "roof type"
        }

        return levelString
      }
    )
  )

  const previewLevelType = (incoming: LevelTypeOption["value"] | null) => {
    const { setPreviewLayout } = houseGroup.userData

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
    const { setActiveLayout, setPreviewLayout, updateDB } = houseGroup.userData

    if (!isActiveLayout(layout)) {
      setActiveLayout(layout)
    }

    setPreviewLayout(null)

    updateDB().then(() => {
      houseGroup.userData.refreshAltSectionTypeLayouts()
      houseGroup.userData.switchHandlesVisibility("STRETCH")
    })

    close()
  }
  return (
    <ContextMenuNested
      long
      label={`Change ${levelString}`}
      icon={<ChangeLevel />}
      unpaddedSvg
    >
      {pipe(
        origOpt,
        O.chain((origLevelTypeOpt) =>
          A.isNonEmpty(altOpts)
            ? O.some(
                <Radio
                  options={[origLevelTypeOpt, ...altOpts]}
                  onChange={changeLevelType}
                  onHoverChange={previewLevelType}
                  selected={origLevelTypeOpt.value}
                  compare={(a, b) => a.levelType.code === b.levelType.code}
                />
              )
            : O.none
        ),
        O.toNullable
      )}
    </ContextMenuNested>
  )
}

export default ChangeLevelType
