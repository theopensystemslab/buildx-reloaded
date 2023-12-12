import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { useMemo } from "react"
import { WindowType } from "../../../../../server/data/windowTypes"
import { useAllModules, useAllWindowTypes } from "../../../../db/systems"
import Radio from "../../../../ui/Radio"
import { Opening } from "../../../../ui/icons"
import { A, O, compareProps } from "../../../../utils/functions"
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

const ChangeWindows = (props: Props) => {
  const { houseTransformsGroup, scopeElement, close } = props

  const { systemId } = getActiveHouseUserData(houseTransformsGroup)

  const windowTypes = useAllWindowTypes()
  const allModules = useAllModules()

  const { windowTypeOptions, originalWindowTypeOption } = useMemo(
    () =>
      pipe(
        allModules,
        A.findFirst(
          (x) => x.systemId === systemId && x.dna === scopeElement.dna
        ),
        O.chain((thisModule) =>
          pipe(
            getWindowType(
              windowTypes,
              thisModule.structuredDna,
              getSide(houseTransformsGroup)
            ),
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
      ),
    [allModules, houseTransformsGroup, scopeElement, systemId, windowTypes]
  )

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
      label={`Change windows/doors`}
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

export default ChangeWindows
