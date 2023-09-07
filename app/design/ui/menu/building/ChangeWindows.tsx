import { invalidate } from "@react-three/fiber"
import { flow, pipe } from "fp-ts/lib/function"
import { Suspense } from "react"
import { suspend } from "suspend-react"
import { Module } from "../../../../../server/data/modules"
import { WindowType } from "../../../../../server/data/windowTypes"
import systemsDB from "../../../../db/systems"
import { Opening } from "../../../../ui/icons"
import Radio from "../../../../ui/Radio"
import { A, O, Ord, S, someOrError, T } from "../../../../utils/functions"
import {
  setInvisibleNoRaycast,
  setVisibleAndRaycast,
} from "../../../../utils/three"
import { getWindowTypeAlternatives } from "../../../../workers/layouts/modules"
import { getSide } from "../../../state/camera"
import { ScopeElement } from "../../../state/scope"
import {
  findFirstGuardUp,
  getActiveHouseUserData,
} from "../../../ui-3d/fresh/helpers/sceneQueries"
import { createModuleGroup } from "../../../ui-3d/fresh/scene/moduleGroup"
import {
  HouseTransformsGroup,
  isModuleGroup,
  ModuleGroup,
} from "../../../ui-3d/fresh/scene/userData"
import ContextMenuNested from "../common/ContextMenuNested"

type WindowTypeOption = {
  label: string
  value: { windowType: string; moduleGroup: ModuleGroup }
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
    scopeElement: { dna, houseId, gridGroupIndex, object },
    close,
  } = props

  const side = getSide(houseTransformsGroup)

  const { systemId } = getActiveHouseUserData(houseTransformsGroup)

  const { windowTypeOptions, originalWindowTypeOption, previewWindowType } =
    suspend(async () => {
      const originalModule = await systemsDB.modules.get({ systemId, dna })
      if (!originalModule)
        throw new Error(`no original module ${systemId} ${dna}`)

      const candidates = await getWindowTypeAlternatives({ systemId, dna })
      const windowTypes = await systemsDB.windowTypes.toArray()

      const getWindowType = (candidate: Module) =>
        pipe(
          windowTypes,
          A.findFirstMap((windowType): O.Option<WindowType> => {
            switch (true) {
              // special case end modules
              case candidate.structuredDna.positionType === "END":
                return windowType.code === candidate.structuredDna.windowTypeEnd
                  ? O.some(windowType)
                  : O.none
              // left = windowTypeSide2
              case side === "LEFT":
                return windowType.code ===
                  candidate.structuredDna.windowTypeSide1
                  ? O.some(windowType)
                  : O.none
              // right = windowTypeSide1
              case side === "RIGHT":
                return windowType.code ===
                  candidate.structuredDna.windowTypeSide2
                  ? O.some(windowType)
                  : O.none
              default:
                return O.none
            }
          })
        )

      const originalModuleGroup = pipe(
        object,
        findFirstGuardUp(isModuleGroup),
        someOrError(`no module group`)
      )

      const originalWindowType = pipe(
        originalModule,
        getWindowType,
        someOrError(`no window type`)
      )

      const originalWindowTypeOption: WindowTypeOption = {
        value: {
          moduleGroup: originalModuleGroup,
          windowType: originalWindowType.code,
        },
        label: originalWindowType.description,
      }

      return pipe(
        candidates,
        A.filterMap((candidate) =>
          pipe(
            candidate,
            getWindowType,
            O.map(
              (windowType): T.Task<WindowTypeOption> =>
                () =>
                  createModuleGroup({
                    systemId,
                    houseId,
                    gridGroupIndex,
                    module: candidate,
                  }).then((moduleGroup) => {
                    moduleGroup.position.copy(originalModuleGroup.position)
                    moduleGroup.scale.copy(originalModuleGroup.scale)

                    setInvisibleNoRaycast(moduleGroup)
                    originalModuleGroup.parent!.add(moduleGroup)

                    return {
                      value: { moduleGroup, windowType: windowType.code },
                      label: windowType.description,
                      thumbnail: windowType.imageUrl,
                    }
                  })
            )
          )
        ),
        A.sequence(T.ApplicativeSeq),
        T.map(
          flow(
            A.concat([originalWindowTypeOption]),
            A.sort(
              pipe(
                S.Ord,
                Ord.contramap((o: WindowTypeOption) => o.value.windowType)
              )
            ),
            (windowTypeOptions) => {
              const previewWindowType = (
                incoming: WindowTypeOption["value"] | null
              ) => {
                if (incoming) {
                  const { moduleGroup } = incoming
                  setInvisibleNoRaycast(originalModuleGroup)
                  setVisibleAndRaycast(moduleGroup)
                } else {
                  setVisibleAndRaycast(originalModuleGroup)
                  for (let {
                    value: { moduleGroup },
                  } of windowTypeOptions) {
                    if (moduleGroup !== originalModuleGroup)
                      setInvisibleNoRaycast(moduleGroup)
                  }
                }
                invalidate()
              }
              return {
                windowTypeOptions,
                originalWindowTypeOption,
                previewWindowType,
              }
            }
          )
        )
      )()
    }, [systemId, dna])

  const changeWindowType = () => {}

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
