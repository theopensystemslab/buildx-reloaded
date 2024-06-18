import { ScopeElement } from "@opensystemslab/buildx-core"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useState } from "react"
import { Module } from "../../../../../server/data/modules"
import { WindowType } from "../../../../../server/data/windowTypes"
import Radio from "../../../../ui/Radio"
import { Opening } from "../../../../ui/icons"
import { getSide } from "../../../state/camera"
import { Layout } from "../../../ui-3d/fresh/scene/userData"
import ContextMenuNested from "./ContextMenuNested"

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

  type AltsData = Awaited<
    ReturnType<typeof houseGroup.layoutsManager.prepareAltWindowTypeLayouts>
  >
  const [data, setData] = useState<AltsData | null>(null)

  useEffect(() => {
    const go = async () => {
      const t0 = performance.now()
      const opts = await houseGroup.layoutsManager.prepareAltWindowTypeLayouts(
        scopeElement,
        getSide(houseGroup)
      )
      const t1 = performance.now()
      console.log(`prepareAltWindowTypeLayouts ${t1 - t0}`)
      setData(opts)
    }
    go()
  }, [houseGroup, data, scopeElement])

  const children =
    data === null
      ? []
      : pipe(
          [...data.options, data.current].sort((a, b) =>
            a.windowType.code.localeCompare(b.windowType.code)
          ),
          (allAlts) => (
            <Radio
              options={allAlts.map((value) => ({
                label: value.windowType.description,
                value,
              }))}
              onHoverChange={(value) => {
                houseGroup.layoutsManager.previewLayoutGroup =
                  value === null ? null : value.layoutGroup
              }}
              onChange={() => {}}
              selected={data.current}
              compare={(a, b) => a.windowType.code === b.windowType.code}
            />
          )
        )

  return (
    <ContextMenuNested
      long
      label={`Change windows`}
      icon={<Opening />}
      unpaddedSvg
    >
      {children}
    </ContextMenuNested>
  )
}

export default ChangeWindows
