import { OpeningsChangeInfo, ScopeElement } from "@opensystemslab/buildx-core"
import { pipe } from "fp-ts/lib/function"
import { useEffect, useState } from "react"
import Radio from "~/ui/Radio"
import { Opening } from "~/ui/icons"
import { O, TE } from "~/utils/functions"
import ContextMenuNested from "./ContextMenuNested"

type Props = {
  scopeElement: ScopeElement
  close: () => void
}

const ChangeWindows = (props: Props) => {
  const { scopeElement, close } = props

  const houseGroup = scopeElement.elementGroup.houseGroup

  const [openingsChangeInfo, setOpeningsChangeInfo] =
    useState<OpeningsChangeInfo | null>(null)

  useEffect(() => {
    pipe(
      houseGroup.openingsManager,
      TE.fromNullable(Error(`houseGroup.openingsManager undefined`)),
      TE.chain((x) => x.createAlts(scopeElement)),
      TE.map((openingsChangeInfo) => {
        setOpeningsChangeInfo(openingsChangeInfo)
      })
    )()
  }, [houseGroup, scopeElement])

  const children =
    openingsChangeInfo === null
      ? undefined
      : pipe(
          openingsChangeInfo.allOpts.sort((a, b) =>
            a.windowType.code.localeCompare(b.windowType.code)
          ),
          (allAlts) => (
            <Radio
              options={allAlts.map((value) => ({
                label: value.windowType.description,
                value,
              }))}
              onHoverChange={(value) => {
                pipe(
                  value,
                  O.fromNullable,
                  O.match(
                    () => {
                      houseGroup.layoutsManager.previewLayoutGroup = O.none
                    },
                    (value) => {
                      houseGroup.layoutsManager.previewLayoutGroup = O.some(
                        value.layoutGroup
                      )
                    }
                  )
                )
              }}
              onChange={(value) => {
                houseGroup.layoutsManager.activeLayoutGroup = value.layoutGroup
                close()
              }}
              selected={openingsChangeInfo.currentOpt}
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
