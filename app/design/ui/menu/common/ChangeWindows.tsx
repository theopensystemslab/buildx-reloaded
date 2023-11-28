import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Suspense, memo, useMemo } from "react"
import { WindowType } from "../../../../../server/data/windowTypes"
import { useAllModules, useAllWindowTypes } from "../../../../db/systems"
import Radio from "../../../../ui/Radio"
import { Opening } from "../../../../ui/icons"
import {
  A,
  O,
  compareProps,
  pipeLog,
  pipeLogWith,
} from "../../../../utils/functions"
import { getWindowType } from "../../../../workers/layouts/worker"
import { getSide } from "../../../state/camera"
import { ScopeElement } from "../../../state/scope"
import { getActiveHouseUserData } from "../../../ui-3d/fresh/helpers/sceneQueries"
import {
  AltWindowTypeLayout,
  HouseTransformsGroup,
  Layout,
  LayoutType,
  isActiveLayout,
} from "../../../ui-3d/fresh/scene/userData"
import ContextMenuNested from "./ContextMenuNested"
import { suspend } from "suspend-react"
import { getLayoutsWorker } from "../../../../workers"
import { createHouseLayoutGroup } from "../../../ui-3d/fresh/scene/houseLayoutGroup"

type WindowTypeOption = {
  label: string
  value: { windowType: WindowType; layout: Layout }
  thumbnail?: string
}

type Props = {
  scopeElement: ScopeElement
  houseTransformsGroup: HouseTransformsGroup
  close: () => void
}

const eqFn = (x: Props, y: Props) =>
  compareProps(x.scopeElement, y.scopeElement, [
    "houseId",
    "columnIndex",
    "levelIndex",
    "moduleIndex",
    "dna",
  ])

const AsyncChangeWindows = (props: Props) => {
  const { scopeElement, houseTransformsGroup } = props

  const { houseId, columnIndex, levelIndex, moduleIndex, dna } = scopeElement

  const { systemId, dnas } = getActiveHouseUserData(houseTransformsGroup)

  const side = getSide(houseTransformsGroup)

  const windowTypes = useAllWindowTypes()
  const allModules = useAllModules()

  const { windowTypeOptions, originalWindowTypeOption } = suspend(async () => {
    const altWindowTypeLayouts =
      await getLayoutsWorker().getAltWindowTypeLayouts({
        systemId,
        columnIndex,
        levelIndex,
        moduleIndex,
        dnas,
        side,
      })

    const originalDnas = dnas

    const indices = [columnIndex, levelIndex, moduleIndex]

    console.log({ dna, indices, optsLen: altWindowTypeLayouts.length })

    for (let { windowType, layout, dnas } of altWindowTypeLayouts) {
      const infoData = {
        originalDnas,
        dnas,
      }

      console.log(infoData)

      await createHouseLayoutGroup({
        systemId: houseTransformsGroup.userData.systemId,
        dnas,
        houseId,
        houseLayout: layout,
        houseTransformsGroup,
      })().then((houseLayoutGroup) => {
        houseTransformsGroup.userData.pushAltLayout({
          type: LayoutType.Enum.ALT_WINDOW_TYPE,
          houseLayoutGroup,
          windowType,
          target: scopeElement,
        })
      })
    }

    return pipe(
      allModules,
      A.findFirst((x) => x.systemId === systemId && x.dna === scopeElement.dna),
      O.chain((thisModule) =>
        pipe(
          getWindowType(windowTypes, thisModule, side),
          O.map((originalWindowType) => {
            const originalWindowTypeOption: WindowTypeOption | null = {
              value: {
                layout: houseTransformsGroup.userData.getActiveLayout(),
                windowType: originalWindowType,
              },
              label: originalWindowType.description,
            }

            const otherOptions: WindowTypeOption[] = pipe(
              houseTransformsGroup.userData.layouts.alts,
              // pipeLogWith((alts) => ({ alts })),
              A.filter(
                (x): x is AltWindowTypeLayout =>
                  x.type === LayoutType.Enum.ALT_WINDOW_TYPE &&
                  compareProps(scopeElement, x.target, [
                    "houseId",
                    "columnIndex",
                    "levelIndex",
                    "moduleIndex",
                  ])
              ),
              A.map((layout) => {
                const { windowType } = layout
                return {
                  value: {
                    layout,
                    windowType,
                  },
                  label: windowType.description,
                  thumbnail: windowType.imageUrl,
                }
              })
            )

            console.log({ otherOptions })

            return {
              originalWindowTypeOption,
              windowTypeOptions: pipe(
                otherOptions,
                A.concat(
                  pipe(
                    originalWindowTypeOption,
                    O.fromNullable,
                    O.match(
                      () => [],
                      (x) => [x]
                    )
                  )
                ),
                A.uniq({
                  equals: (x, y) => {
                    return x.value.windowType.code === y.value.windowType.code
                  },
                })
              ),
            }
          })
        )
      ),
      O.getOrElse(() => ({
        originalWindowTypeOption: null as WindowTypeOption | null,
        windowTypeOptions: [] as WindowTypeOption[],
      }))
    )
  }, [houseId, JSON.stringify(dnas), columnIndex, levelIndex, moduleIndex])

  const { setPreviewLayout } = houseTransformsGroup.userData

  const previewWindowType = (incoming: WindowTypeOption["value"] | null) => {
    if (incoming) {
      if (!isActiveLayout(incoming.layout)) {
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
      houseTransformsGroup.userData.refreshAltWindowTypeLayouts(scopeElement)
      houseTransformsGroup.userData.refreshAltSectionTypeLayouts()
      houseTransformsGroup.userData.refreshAltResetLayout()
      houseTransformsGroup.userData.refreshAltLevelTypeLayouts(scopeElement)
      houseTransformsGroup.userData.switchHandlesVisibility("STRETCH")
    })

    close()
  }

  return originalWindowTypeOption !== null && windowTypeOptions.length > 1 ? (
    <ContextMenuNested
      long
      label={`Change windows`}
      icon={<Opening />}
      unpaddedSvg
    >
      <Radio
        options={windowTypeOptions}
        selected={originalWindowTypeOption.value}
        onChange={changeWindowType}
        onHoverChange={previewWindowType}
        compare={(a, b) => a.windowType.code === b.windowType.code}
      />
    </ContextMenuNested>
  ) : null
}

const ChangeWindows = (props: Props) => {
  return (
    <Suspense fallback={null}>
      <AsyncChangeWindows {...props} />
    </Suspense>
  )
}

export default ChangeWindows
