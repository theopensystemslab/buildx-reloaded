import { useEvent } from "react-use"
import { proxy, useSnapshot } from "valtio"
import * as z from "zod"
import { formatWithUnit } from "../../analyse/state/data"
import userDB from "../../db/user"
import { useSubscribe } from "../../utils/hooks"
import { BUILDX_LOCAL_STORAGE_CONTEXT_KEY } from "./constants"
import houses from "./houses"

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

const siteCtx = proxy<SiteCtx>(defaults)

userDB.siteCtx.get(BUILDX_LOCAL_STORAGE_CONTEXT_KEY).then((x) => {
  if (x) {
    Object.assign(siteCtx, x)
  }
})

export const useSiteCtx = () => useSnapshot(siteCtx)

export const useIndexedSiteCtx = () =>
  useSubscribe(siteCtx, () => {
    // Save state asynchronously using Dexie
    userDB.siteCtx
      .put({
        key: BUILDX_LOCAL_STORAGE_CONTEXT_KEY,
        ...siteCtx,
      })
      .catch((err) => {
        console.error("Failed to save site context:", err)
      })
  })

export const useProjectName = () => {
  const ctx = useSnapshot(siteCtx)
  const { projectName } = ctx
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

export const useSystemId = () => {
  const { houseId } = useSiteCtx()
  if (houseId === null) return null
  return houses[houseId].systemId
}

export const getModeBools = (_mode?: SiteCtxMode) => {
  const mode = _mode ?? siteCtx.mode

  const siteMode = mode === SiteCtxModeEnum.Enum.SITE

  const buildingMode = mode === SiteCtxModeEnum.Enum.BUILDING

  const levelMode = mode === SiteCtxModeEnum.Enum.LEVEL

  return {
    siteMode,
    buildingMode,
    levelMode,
  }
}

export default siteCtx
