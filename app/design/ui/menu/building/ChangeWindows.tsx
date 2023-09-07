import { pipe } from "fp-ts/lib/function"
import React, { Suspense } from "react"
import { suspend } from "suspend-react"
import systemsDB from "../../../../db/systems"
import { Opening } from "../../../../ui/icons"
import Radio from "../../../../ui/Radio"
import { A, someOrError, T } from "../../../../utils/functions"
import { getWindowTypeAlternatives } from "../../../../workers/layouts/modules"
import { getSide } from "../../../state/camera"
import { ScopeElement } from "../../../state/scope"
import {
  findFirstGuardUp,
  getActiveHouseUserData,
} from "../../../ui-3d/fresh/helpers/sceneQueries"
import { createModuleGroup } from "../../../ui-3d/fresh/scene/moduleGroup"
import {
  HouseLayoutGroup,
  HouseTransformsGroup,
  isModuleGroup,
  ModuleGroup,
} from "../../../ui-3d/fresh/scene/userData"
import ContextMenuNested from "../common/ContextMenuNested"

type Props = {
  scopeElement: ScopeElement
  houseTransformsGroup: HouseTransformsGroup
  close: () => void
}

const ChangeWindowsOptions = (props: Props) => {
  const {
    houseTransformsGroup,
    scopeElement: { dna, houseId, gridGroupIndex, object },
    close,
  } = props

  const side = getSide(houseTransformsGroup)

  const { systemId } = getActiveHouseUserData(houseTransformsGroup)

  console.log(side)

  const { windowTypeOptions, originalWindowTypeOption } = suspend(
    // I'm using fp-ts and dealing with some async code
    async () => {
      const originalModule = await systemsDB.modules.get({ systemId, dna })
      if (!originalModule)
        throw new Error(`no original module ${systemId} ${dna}`)

      const candidates = await getWindowTypeAlternatives({ systemId, dna })

      const originalWindowTypeOption = {
        value: {
          moduleGroup: pipe(
            object,
            findFirstGuardUp(isModuleGroup),
            someOrError(`no module group`)
          ),
          module: originalModule,
        },
        label: originalModule.description,
      }

      return pipe(
        candidates,
        A.map(
          (module) => () =>
            createModuleGroup({
              systemId,
              houseId,
              gridGroupIndex,
              module,
            }).then((moduleGroup) => ({
              value: { moduleGroup, module },
              label: module.description,
            }))
        ),
        A.sequence(T.ApplicativeSeq),
        T.map((windowTypeOptions) => ({
          windowTypeOptions,
          originalWindowTypeOption,
        }))
      )()
    },
    [systemId, dna]
  )

  const changeWindowType = () => {}
  const previewWindowType = () => {}

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
  const { houseTransformsGroup, scopeElement, close } = props

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
