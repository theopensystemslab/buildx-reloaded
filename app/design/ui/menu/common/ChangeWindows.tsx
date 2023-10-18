import { invalidate } from "@react-three/fiber"
import { flow, pipe } from "fp-ts/lib/function"
import { Suspense, useRef } from "react"
import { suspend } from "suspend-react"
import { Module } from "../../../../../server/data/modules"
import { WindowType } from "../../../../../server/data/windowTypes"
import systemsDB from "../../../../db/systems"
import { Opening } from "../../../../ui/icons"
import Radio from "../../../../ui/Radio"
import { A, O, Ord, S, someOrError, T } from "../../../../utils/functions"
import { setInvisibleNoRaycast } from "../../../../utils/three"
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
  isColumnGroup,
  isModuleGroup,
  ModuleGroup,
  ModuleGroupUse,
} from "../../../ui-3d/fresh/scene/userData"
import ContextMenuNested from "./ContextMenuNested"

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

  const originalModuleGroup = pipe(
    object,
    findFirstGuardUp(isModuleGroup),
    someOrError(`no module group`)
  )

  const side = getSide(houseTransformsGroup)

  const { systemId } = getActiveHouseUserData(houseTransformsGroup)

  const closing = useRef(false)

  const { windowTypeOptions, originalWindowTypeOption } = suspend(async () => {
    const originalModule = await systemsDB.modules.get({ systemId, dna })
    if (!originalModule)
      throw new Error(`no original module ${systemId} ${dna}`)

    const candidates = await getWindowTypeAlternatives({
      systemId,
      dna,
      side: "LEFT",
    })
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
              return windowType.code === candidate.structuredDna.windowTypeSide1
                ? O.some(windowType)
                : O.none
            // right = windowTypeSide1
            case side === "RIGHT":
              return windowType.code === candidate.structuredDna.windowTypeSide2
                ? O.some(windowType)
                : O.none
            default:
              return O.none
          }
        })
      )

    const originalColumnGroup = pipe(
      originalModuleGroup,
      findFirstGuardUp(isColumnGroup),

      someOrError(`no column group`)
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
                  use: ModuleGroupUse.Enum.ALT_WINDOW_TYPE,
                  flip: originalColumnGroup.userData.endColumn ?? false,
                  visible: false,
                  z: originalModuleGroup.userData.z,
                  houseTransformsGroup,
                }).then((moduleGroup) => {
                  setInvisibleNoRaycast(moduleGroup)
                  originalModuleGroup.parent!.add(moduleGroup)

                  return {
                    value: {
                      moduleGroup,
                      windowType: windowType.code,
                    },
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
            return {
              windowTypeOptions,
              originalWindowTypeOption,
            }
          }
        )
      )
    )()
  }, [systemId, dna])

  const previewWindowType = (incoming: WindowTypeOption["value"] | null) => {
    if (closing.current) return

    if (incoming === null) {
      originalModuleGroup.userData.setThisModuleGroupVisible()
    } else {
      incoming.moduleGroup.userData.setThisModuleGroupVisible()
    }

    invalidate()
  }

  const changeWindowType = ({ moduleGroup }: WindowTypeOption["value"]) => {
    closing.current = true

    moduleGroup.userData.setThisModuleGroupVisible()

    houseTransformsGroup.userData
      .unsafeGetActiveLayoutGroup()
      .userData.updateDnas()

    houseTransformsGroup.userData.updateDB().then(() => {
      houseTransformsGroup.userData.refreshAltSectionTypeLayouts()
    })

    close()
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
