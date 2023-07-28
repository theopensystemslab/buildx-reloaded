import { RefObject } from "react"
import { Group } from "three"
import { useSubscribeKey } from "../../../utils/hooks"
import siteCtx, { SiteCtxModeEnum } from "../../state/siteCtx"

const useModeHandling = (rootRef: RefObject<Group>) => {
  useSubscribeKey(siteCtx, "mode", () => {
    const { mode } = siteCtx

    switch (mode) {
      case SiteCtxModeEnum.Enum.SITE:
        console.log("site mode")
        break
      case SiteCtxModeEnum.Enum.BUILDING:
        console.log("building mode")
        break
      case SiteCtxModeEnum.Enum.LEVEL:
        console.log("level mode")
        break
    }
  })
}

export default useModeHandling
