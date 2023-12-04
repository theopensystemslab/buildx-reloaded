import React, { useEffect, useMemo, useState } from "react"
import ContextMenuNested from "./ContextMenuNested"
import { Opening } from "../../../../ui/icons"
import { WindowType } from "../../../../../server/data/windowTypes"
import {
  AltLayout,
  AltWindowTypeLayout,
  HouseTransformsGroup,
  Layout,
  LayoutType,
  isActiveLayout,
} from "../../../ui-3d/fresh/scene/userData"
import { pipe } from "fp-ts/lib/function"
import { ScopeElement } from "../../../state/scope"
import { getLayoutsWorker } from "../../../../workers"
import { getActiveHouseUserData } from "../../../ui-3d/fresh/helpers/sceneQueries"
import { getSide } from "../../../state/camera"
import { A, O, T, pipeLog } from "../../../../utils/functions"
import { createHouseLayoutGroup } from "../../../ui-3d/fresh/scene/houseLayoutGroup"
import { getWindowType } from "../../../../workers/layouts/worker"
import { useAllModules, useAllWindowTypes } from "../../../../db/systems"
import { Module, parseDna } from "../../../../../server/data/modules"
import Radio from "../../../../ui/Radio"
import { invalidate } from "@react-three/fiber"

type WindowTypeOption = {
  label: string
  value: { windowType: WindowType; layout: Layout; candidate?: Module }
  thumbnail?: string
}

type Props = {
  scopeElement: ScopeElement
  houseTransformsGroup: HouseTransformsGroup
  close: () => void
}

const ChangeWindowsFresh = (props: Props) => {
  const { houseTransformsGroup, scopeElement, close } = props

  const { systemId, houseId, dnas } =
    getActiveHouseUserData(houseTransformsGroup)

  const { columnIndex, levelIndex, moduleIndex, dna } = scopeElement

  const side = getSide(houseTransformsGroup)

  const allWindowTypes = useAllWindowTypes()

  const [altWinTypeOpts, setAltWinTypeOpts] = useState<WindowTypeOption[]>([])

  const origWinTypeOpt = useMemo(
    (): O.Option<WindowTypeOption> =>
      pipe(
        getWindowType(
          allWindowTypes,
          parseDna(dna),
          getSide(houseTransformsGroup)
        ),
        O.map(
          (windowType): WindowTypeOption => ({
            label: windowType.description,
            value: {
              layout: houseTransformsGroup.userData.getActiveLayout(),
              windowType,
            },
            thumbnail: windowType.imageUrl,
          })
        )
      ),

    [allWindowTypes, dna, houseTransformsGroup]
  )

  // console.log({
  //   origWinTypeOpt,
  //   altWinTypeOpts,
  //   side,
  //   indices: [columnIndex, levelIndex, moduleIndex],
  //   dna,
  // })

  useEffect(() => {
    pipe(
      () =>
        getLayoutsWorker().getAltWindowTypeLayouts({
          systemId,
          columnIndex,
          levelIndex,
          moduleIndex,
          dnas,
          side,
        }),
      T.chain((altWindowTypeLayouts) =>
        pipe(
          altWindowTypeLayouts,
          A.traverse(T.ApplicativeSeq)(
            ({ candidate, dnas, layout: houseLayout, windowType }) =>
              pipe(
                createHouseLayoutGroup({
                  systemId,
                  dnas,
                  houseId,
                  houseLayout,
                  houseTransformsGroup,
                }),
                T.map((houseLayoutGroup): WindowTypeOption => {
                  const layout: AltWindowTypeLayout = {
                    houseLayoutGroup,
                    windowType,
                    type: LayoutType.Enum.ALT_WINDOW_TYPE,
                    target: scopeElement,
                  }

                  houseTransformsGroup.userData.pushAltLayout(layout)

                  return {
                    label: windowType.description,
                    thumbnail: windowType.imageUrl,
                    value: {
                      layout,
                      windowType,
                      candidate,
                    },
                  }
                })
              )
          )
        )
      )
    )().then((altWinTypeOpts) => {
      // console.log({ altWinTypeOpts })
      setAltWinTypeOpts(altWinTypeOpts)
    })

    return () => {
      houseTransformsGroup.userData.dropAltLayoutsByType(
        LayoutType.Enum.ALT_WINDOW_TYPE
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    columnIndex,
    dnas,
    houseId,
    levelIndex,
    moduleIndex,
    scopeElement,
    side,
    systemId,
  ])

  const { setPreviewLayout } = houseTransformsGroup.userData

  const previewWindowType = (incoming: WindowTypeOption["value"] | null) => {
    if (incoming) {
      if (!isActiveLayout(incoming.layout)) {
        // console.log(
        //   `currently active layout dnas`,
        //   houseTransformsGroup.userData.layouts.active.houseLayoutGroup.userData
        //     .dnas
        // )
        if (incoming.candidate) {
          const { windowTypeSide1, windowTypeSide2 } =
            incoming.candidate.structuredDna
          console.log(`PREVIEW: ${windowTypeSide1}-${windowTypeSide2}`)
        }

        setPreviewLayout(incoming.layout)
      }
      // houseTransformsGroup.userData.setActiveLayoutGroup(incoming.layout)
      // houseTransformsGroup.userData.updateHandles()
    } else {
      setPreviewLayout(null)
      // if (originalWindowTypeOption)
      //   houseTransformsGroup.userData.setActiveLayoutGroup(
      //     originalWindowTypeOption.value.layout
      //   )
    }

    invalidate()
  }

  const changeWindowType = ({ layout }: WindowTypeOption["value"]) => {
    const { setActiveLayout, setPreviewLayout, updateDB } =
      houseTransformsGroup.userData

    if (!isActiveLayout(layout)) {
      setActiveLayout(layout)
    }

    setPreviewLayout(null)

    updateDB().then(() => {
      // houseTransformsGroup.userData.dropAltLayoutsByType(
      //   LayoutType.Enum.ALT_WINDOW_TYPE
      // )
      // houseTransformsGroup.userData.refreshAltWindowTypeLayouts(scopeElement)
      houseTransformsGroup.userData.refreshAltSectionTypeLayouts()
      // houseTransformsGroup.userData.refreshAltResetLayout()
      // houseTransformsGroup.userData.refreshAltLevelTypeLayouts(scopeElement)
      houseTransformsGroup.userData.switchHandlesVisibility("STRETCH")
    })

    close()
  }

  return (
    <ContextMenuNested
      long
      label={`Change windows`}
      icon={<Opening />}
      unpaddedSvg
    >
      {pipe(
        origWinTypeOpt,
        O.chain((origWinTypeOpt) =>
          A.isNonEmpty(altWinTypeOpts)
            ? O.some(
                <Radio
                  options={[origWinTypeOpt, ...altWinTypeOpts]}
                  onChange={changeWindowType}
                  onHoverChange={previewWindowType}
                  selected={origWinTypeOpt.value}
                  compare={(a, b) => a.windowType.code === b.windowType.code}
                />
              )
            : O.none
        ),
        O.toNullable
      )}
    </ContextMenuNested>
  )
}

export default ChangeWindowsFresh
