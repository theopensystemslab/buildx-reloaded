import { Close } from "@carbon/icons-react"
import usePortal from "react-cool-portal"
import { SiteCtxModeEnum, upMode, useSiteCtx } from "../hooks/siteCtx"

const ExitMode = () => {
  const { mode } = useSiteCtx()

  const { Portal } = usePortal({
    autoRemoveContainer: false,
    internalShowHide: false,
  })

  return mode === SiteCtxModeEnum.Enum.SITE ? null : (
    <Portal>
      <div className="absolute left-1/2 top-32 z-50 flex -translate-x-1/2 transform justify-center">
        <button
          onClick={upMode}
          className="flex justify-between items-center h-12 rounded-full bg-white p-2 text-green-500 shadow-lg hover:bg-grey-10"
        >
          <span className="ml-6 mr-2">{`Exit ${mode.toLowerCase()}`}</span>
          <span className="w-8 p-1">
            <Close size="24" />
          </span>
        </button>
      </div>
    </Portal>
  )
}

export default ExitMode
