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
import { ScopeElement } from "@opensystemslab/buildx-core"

type WindowTypeOption = {
  label: string
  value: { windowType: WindowType; layout: Layout; candidate?: Module }
  thumbnail?: string
}

type Props = {
  scopeElement: ScopeElement
  close: () => void
}

const ChangeWindows = (props: Props) => {
  console.log(`ChangeWindows`)
  const { scopeElement, close } = props

  const houseGroup = scopeElement.elementGroup.houseGroup

  const { systemId, houseId } = houseGroup.userData
  const { dnas } = houseGroup.activeLayoutGroup.userData

  const { columnIndex, rowIndex, moduleIndex, dna } = scopeElement

  // const side = getSide(houseGroup)

  // const allWindowTypes = useAllWindowTypes()

  // const [altWinTypeOpts, setAltWinTypeOpts] = useState<WindowTypeOption[]>([])

  // const origWinTypeOpt = useMemo(
  //   (): O.Option<WindowTypeOption> =>
  //     pipe(
  //       getWindowType(allWindowTypes, parseDna(dna), getSide(houseGroup)),
  //       O.map(
  //         (windowType): WindowTypeOption => ({
  //           label: windowType.description,
  //           value: {
  //             layout: houseGroup.userData.getActiveLayout(),
  //             windowType,
  //           },
  //           thumbnail: windowType.imageUrl,
  //         })
  //       )
  //     ),

  //   [allWindowTypes, dna, houseGroup]
  // )

  // console.log({
  //   origWinTypeOpt,
  //   altWinTypeOpts,
  //   side,
  //   indices: [columnIndex, levelIndex, moduleIndex],
  //   dna,
  // })

  // useEffect(() => {
  //   pipe(
  //     () =>
  //       getLayoutsWorker().getAltWindowTypeLayouts({
  //         systemId,
  //         columnIndex,
  //         levelIndex: rowIndex,
  //         moduleIndex,
  //         dnas,
  //         side,
  //       }),
  //     T.chain((altWindowTypeLayouts) =>
  //       pipe(
  //         altWindowTypeLayouts,
  //         A.traverse(T.ApplicativeSeq)(
  //           ({ candidate, dnas, layout: houseLayout, windowType }) =>
  //             pipe(
  //               createHouseLayoutGroup({
  //                 systemId,
  //                 dnas,
  //                 houseId,
  //                 houseLayout,
  //                 houseTransformsGroup: houseGroup,
  //               }),
  //               T.map((houseLayoutGroup): WindowTypeOption => {
  //                 const layout: AltWindowTypeLayout = {
  //                   houseLayoutGroup,
  //                   windowType,
  //                   type: LayoutType.Enum.ALT_WINDOW_TYPE,
  //                   target: scopeElement,
  //                 }

  //                 houseGroup.userData.pushAltLayout(layout)

  //                 return {
  //                   label: windowType.description,
  //                   thumbnail: windowType.imageUrl,
  //                   value: {
  //                     layout,
  //                     windowType,
  //                     candidate,
  //                   },
  //                 }
  //               })
  //             )
  //         )
  //       )
  //     )
  //   )().then((altWinTypeOpts) => {
  //     // console.log({ altWinTypeOpts })
  //     setAltWinTypeOpts(altWinTypeOpts)
  //   })

  //   return () => {
  //     houseGroup.userData.dropAltLayoutsByType(LayoutType.Enum.ALT_WINDOW_TYPE)
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [
  //   columnIndex,
  //   dnas,
  //   houseId,
  //   rowIndex,
  //   moduleIndex,
  //   scopeElement,
  //   side,
  //   systemId,
  // ])

  // const { setPreviewLayout } = houseGroup.userData

  // const previewWindowType = (incoming: WindowTypeOption["value"] | null) => {
  //   if (incoming) {
  //     if (!isActiveLayout(incoming.layout)) {
  //       if (incoming.candidate) {
  //         const { windowTypeSide1, windowTypeSide2 } =
  //           incoming.candidate.structuredDna
  //         console.log(`PREVIEW: ${windowTypeSide1}-${windowTypeSide2}`)
  //       }

  //       setPreviewLayout(incoming.layout)
  //     }
  //   } else {
  //     setPreviewLayout(null)
  //   }

  //   invalidate()
  // }

  // const changeWindowType = ({ layout }: WindowTypeOption["value"]) => {
  //   const { setActiveLayout, setPreviewLayout, updateDB } = houseGroup.userData

  //   if (!isActiveLayout(layout)) {
  //     setActiveLayout(layout)
  //   }

  //   setPreviewLayout(null)

  //   updateDB().then(() => {
  //     houseGroup.userData.refreshAltSectionTypeLayouts()
  //     houseGroup.userData.switchHandlesVisibility("STRETCH")
  //   })

  //   close()
  // }

  const [options, setOptions] = useState<
    Array<{ layoutGroup: any; windowType: WindowType }>
  >([])

  useEffect(() => {
    const go = async () => {
      const t0 = performance.now()
      const { options } =
        await houseGroup.layoutsManager.prepareAltWindowTypeLayouts(
          scopeElement,
          getSide(houseGroup)
        )
      const t1 = performance.now()
      console.log(`prepareAltWindowTypeLayouts ${t1 - t0}`)
      setOptions(options)
    }
    go()
  }, [houseGroup, scopeElement])

  return (
    <ContextMenuNested
      long
      label={`Change windows`}
      icon={<Opening />}
      unpaddedSvg
    >
      {options.length > 1 ? (
        <Radio
          options={options}
          onChange={changeWindowType}
          onHoverChange={previewWindowType}
          selected={origWinTypeOpt.value}
          compare={(a, b) => a.windowType.code === b.windowType.code}
        />
      ) : null}
    </ContextMenuNested>
  )
}

export default ChangeWindows
