import { useLiveQuery } from "dexie-react-hooks"
import { useEvent } from "react-use"
import * as z from "zod"
import userDB from "."
import { formatWithUnit } from "../../analyse/state/data"
import { BUILDX_LOCAL_STORAGE_CONTEXT_KEY } from "../../design/state/constants"
import { liveQuery } from "dexie"

export const SiteCtxModeEnum = z.enum(["SITE", "BUILDING", "LEVEL"])
export type SiteCtxMode = z.infer<typeof SiteCtxModeEnum>

export type SiteCtx = {
  mode: SiteCtxMode
  houseId: string | null
  levelIndex: number | null
  projectName: string | null
  region: "UK" | "EU"
}

const defaults: SiteCtx = {
  houseId: null,
  levelIndex: null,
  projectName: null,
  mode: SiteCtxModeEnum.Enum.SITE,
  region: "UK",
}

export const getSiteCtx = () =>
  userDB.siteCtx.get(BUILDX_LOCAL_STORAGE_CONTEXT_KEY).then((result) => {
    if (result) {
      const { key, ...rest } = result
      return rest
    } else {
      return defaults
    }
  })

export const useSiteCtx = (): SiteCtx => useLiveQuery(getSiteCtx, [], defaults)

export const useSubscribeSiteCtx = (f: (siteCtx: SiteCtx) => void) => {
  liveQuery(getSiteCtx).subscribe(f)
}

export const useProjectName = () => {
  const { projectName } = useSiteCtx()
  if (projectName === null || projectName.length <= 0) return "New project"
  else return projectName
}

const MODE_CHANGE_EVENT = "ModeChangeEvent"

export type ModeChangeEventDetail = {
  prev?: SiteCtxMode
  next: SiteCtxMode
  houseId?: string
  levelIndex?: number
}

export const dispatchModeChange = (detail: ModeChangeEventDetail) =>
  dispatchEvent(new CustomEvent(MODE_CHANGE_EVENT, { detail }))

export const useModeChangeListener = (
  f: (eventDetail: ModeChangeEventDetail) => void
) => useEvent(MODE_CHANGE_EVENT, ({ detail }) => f(detail))

export const useSiteCurrency = () => {
  const { region } = useSiteCtx()
  const symbol = region === "UK" ? "£" : "€"
  const code = region === "UK" ? "GBP" : "EUR"

  return {
    symbol,
    code,
    formatWithSymbol: (x: number) => formatWithUnit(x, symbol),
    formatWithCode: (x: number) => formatWithUnit(x, code),
  }
}

// export const getModeBools = (_mode?: SiteCtxMode) => {
//   const siteCtx = getSiteCtx()

//   const mode = _mode ?? siteCtx.mode

//   const siteMode = mode === SiteCtxModeEnum.Enum.SITE

//   const buildingMode = mode === SiteCtxModeEnum.Enum.BUILDING

//   const levelMode = mode === SiteCtxModeEnum.Enum.LEVEL

//   return {
//     siteMode,
//     buildingMode,
//     levelMode,
//   }
// }

// export default siteCtx
