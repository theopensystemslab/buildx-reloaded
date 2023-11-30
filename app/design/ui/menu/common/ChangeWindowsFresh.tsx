import React, { useEffect, useState } from "react"
import ContextMenuNested from "./ContextMenuNested"
import { Opening } from "../../../../ui/icons"
import { WindowType } from "../../../../../server/data/windowTypes"
import {
  HouseTransformsGroup,
  Layout,
  LayoutType,
} from "../../../ui-3d/fresh/scene/userData"
import { pipe } from "fp-ts/lib/function"
import { ScopeElement } from "../../../state/scope"
import { getLayoutsWorker } from "../../../../workers"
import { getActiveHouseUserData } from "../../../ui-3d/fresh/helpers/sceneQueries"
import { getSide } from "../../../state/camera"
import { A, T } from "../../../../utils/functions"
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

const ChangeWindowsFresh = (props: Props) => {
  const { houseTransformsGroup, scopeElement, close } = props

  const { systemId, houseId, dnas } =
    getActiveHouseUserData(houseTransformsGroup)

  const { columnIndex, levelIndex, moduleIndex } = scopeElement

  const side = getSide(houseTransformsGroup)

  const [options, setOptions] = useState<WindowTypeOption[]>([])

  useEffect(
    () =>
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
        T.map((altWindowTypeLayouts) =>
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
                  T.map((houseLayoutGroup) => {
                    houseTransformsGroup.userData.pushAltLayout({
                      type: LayoutType.Enum.ALT_WINDOW_TYPE,
                      houseLayoutGroup,
                      windowType,
                      target: scopeElement,
                    })

                    return {
                      houseLayoutGroup,
                      windowType,
                    }
                  })
                )
            ),
            T.map((x): WindowTypeOption => ({}))
          )
        ),
        () => () => {
          houseTransformsGroup.userData.dropAltLayoutsByType(
            LayoutType.Enum.ALT_WINDOW_TYPE
          )
        }
      ),
    [
      columnIndex,
      dnas,
      houseId,
      houseTransformsGroup,
      levelIndex,
      moduleIndex,
      scopeElement,
      side,
      systemId,
    ]
  )

  return (
    <ContextMenuNested
      long
      label={`Change windows`}
      icon={<Opening />}
      unpaddedSvg
    ></ContextMenuNested>
  )
}

export default ChangeWindowsFresh
