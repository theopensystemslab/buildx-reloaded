import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useMemo, useRef } from "react"
import { WindowType } from "../../../../../server/data/windowTypes"
import { useAllModules, useAllWindowTypes } from "../../../../db/systems"
import Radio from "../../../../ui/Radio"
import { Opening } from "../../../../ui/icons"
import { A, O, debounce } from "../../../../utils/functions"
import { getWindowType } from "../../../../workers/layouts/worker"
import { getSide } from "../../../state/camera"
import { ScopeElement } from "../../../state/scope"
import { getActiveHouseUserData } from "../../../ui-3d/fresh/helpers/sceneQueries"
import {
  HouseLayoutGroup,
  HouseLayoutGroupUse,
  HouseTransformsGroup,
  isHouseLayoutGroup,
} from "../../../ui-3d/fresh/scene/userData"
import ContextMenuNested from "./ContextMenuNested"

type WindowTypeOption = {
  label: string
  value: { windowType: WindowType; layoutGroup: HouseLayoutGroup }
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
              thisModule,
              getSide(houseTransformsGroup)
            ),
            O.map((originalWindowType) => {
              const originalWindowTypeOption: WindowTypeOption | null = {
                value: {
                  layoutGroup:
                    houseTransformsGroup.userData.unsafeGetActiveLayoutGroup(),
                  windowType: originalWindowType,
                },
                label: originalWindowType.description,
              }

              const otherOptions: WindowTypeOption[] = pipe(
                houseTransformsGroup.children,
                A.filter(
                  (x): x is HouseLayoutGroup =>
                    isHouseLayoutGroup(x) &&
                    x.userData.use ===
                      HouseLayoutGroupUse.Enum.ALT_WINDOW_TYPE &&
                    x.userData.windowType
                ),
                A.map((layoutGroup): WindowTypeOption => {
                  // TODO: DEBT
                  const windowType: WindowType = layoutGroup.userData.windowType

                  return {
                    value: {
                      layoutGroup,
                      windowType,
                    },
                    label: windowType.description,
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
                    equals: (x, y) =>
                      x.value.windowType.code === y.value.windowType.code,
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
    [allModules, houseTransformsGroup, scopeElement.dna, systemId, windowTypes]
  )

  const locked = useRef(false)

  useEffect(() => {
    locked.current = false
  }, [])

  const previewWindowType = (incoming: WindowTypeOption["value"] | null) => {
    if (locked.current) return

    if (incoming) {
      houseTransformsGroup.userData.setActiveLayoutGroup(incoming.layoutGroup)
      houseTransformsGroup.userData.updateHandles()
    } else {
      if (originalWindowTypeOption)
        houseTransformsGroup.userData.setActiveLayoutGroup(
          originalWindowTypeOption.value.layoutGroup
        )
    }

    invalidate()
  }

  const changeWindowType = () => {
    locked.current = true

    houseTransformsGroup.userData.updateDB().then(() => {
      pipe(
        houseTransformsGroup.children,
        A.filter(
          (x) =>
            isHouseLayoutGroup(x) &&
            x.userData.use === HouseLayoutGroupUse.Enum.ALT_WINDOW_TYPE
        ),
        A.map((x) => {
          x.removeFromParent()
        })
      )
      houseTransformsGroup.userData.refreshAltSectionTypeLayouts()
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
      />
    </ContextMenuNested>
  ) : null
}

export default ChangeWindows
