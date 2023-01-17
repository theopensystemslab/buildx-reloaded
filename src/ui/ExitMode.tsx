import usePortal from "react-cool-portal"
import { SiteCtxModeEnum, upMode, useSiteCtx } from "../hooks/siteCtx"
import { Check } from "./icons"

const ExitMode = () => {
  const { mode } = useSiteCtx()

  const { Portal } = usePortal({
    autoRemoveContainer: false,
    internalShowHide: false,
  })

  return mode === SiteCtxModeEnum.Enum.SITE ? null : (
    <Portal>
      <div className="absolute left-1/2 top-16 z-50 flex -translate-x-1/2 transform justify-center">
        <button
          onClick={upMode}
          className="block h-12 w-12 rounded-full bg-white p-2 text-green-500 shadow-lg hover:bg-gray-100"
        >
          <span>{`Exit ${mode.toLowerCase()} mode?`}</span>
          <Check />
        </button>
      </div>
    </Portal>
  )
}

export default ExitMode
