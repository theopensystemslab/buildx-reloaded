import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Suspense } from "react"
import { WindowType } from "../../../../../server/data/windowTypes"
import { useAllModules, useAllWindowTypes } from "../../../../db/systems"
import Radio from "../../../../ui/Radio"
import { Opening } from "../../../../ui/icons"
import { A, someOrError } from "../../../../utils/functions"
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

const ChangeWindowsOptions = (props: Props) => {
  const {
    houseTransformsGroup,
    scopeElement: { dna },
    close,
  } = props

  const { systemId } = getActiveHouseUserData(houseTransformsGroup)

  const windowTypes = useAllWindowTypes()
  const allModules = useAllModules()

  if (windowTypes.length === 0 || allModules.length === 0) return null

  const thisModule = pipe(
    allModules,
    A.findFirst((x) => x.systemId === systemId && x.dna === dna),
    someOrError(`no module`)
  )

  const { windowTypeOptions, originalWindowTypeOption } = (() => {
    const side = getSide(houseTransformsGroup)

    const originalWindowType = pipe(
      getWindowType(windowTypes, thisModule, side),
      someOrError(`no original window type`)
    )

    const originalWindowTypeOption: WindowTypeOption = {
      value: {
        layoutGroup: houseTransformsGroup.userData.unsafeGetActiveLayoutGroup(),
        windowType: originalWindowType,
      },
      label: originalWindowType.description,
    }

    const otherOptions: WindowTypeOption[] = pipe(
      houseTransformsGroup.children,
      A.filter(
        (x): x is HouseLayoutGroup =>
          isHouseLayoutGroup(x) &&
          x.userData.use === HouseLayoutGroupUse.Enum.ALT_WINDOW_TYPE &&
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
        A.append(originalWindowTypeOption),
        A.uniq({
          equals: (x, y) => x.value.windowType.code === y.value.windowType.code,
        })
      ),
    }
  })()

  const previewWindowType = (incoming: WindowTypeOption["value"] | null) => {
    if (incoming === null) {
      houseTransformsGroup.userData.setActiveLayoutGroup(
        originalWindowTypeOption.value.layoutGroup
      )
    } else {
      houseTransformsGroup.userData.setActiveLayoutGroup(incoming.layoutGroup)
    }

    invalidate()
  }

  const changeWindowType = () => {
    close()

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

    houseTransformsGroup.userData.updateDB().then(() => {
      houseTransformsGroup.userData.refreshAltSectionTypeLayouts()
      houseTransformsGroup.userData.switchHandlesVisibility("STRETCH")
    })
  }

  return (
    <Radio
      options={windowTypeOptions}
      selected={originalWindowTypeOption.value}
      onChange={changeWindowType}
      onHoverChange={previewWindowType}
    />
  )
}

const ChangeWindows = (props: Props) => {
  return (
    <ContextMenuNested
      long
      label={`Change windows`}
      icon={<Opening />}
      unpaddedSvg
    >
      <Suspense fallback={null}>
        <ChangeWindowsOptions {...props} />
      </Suspense>
    </ContextMenuNested>
  )
}

export default ChangeWindows
