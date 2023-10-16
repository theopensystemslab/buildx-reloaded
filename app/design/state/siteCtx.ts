import { useEffect } from "react"
import { useEvent } from "react-use"
import { proxy, subscribe, useSnapshot } from "valtio"
import * as z from "zod"
import { isSSR } from "~/utils/next"
import { formatWithUnit } from "../../analyse/state/data"
import { BUILDX_LOCAL_STORAGE_CONTEXT_KEY } from "./constants"
import houses from "./houses"
import { useSubscribe } from "../../utils/hooks"
import userDB from "../../db/user"

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

// export const enterBuildingMode = (houseId: string) => {
//   if (siteCtx.houseId !== houseId) siteCtx.houseId = houseId
//   if (siteCtx.levelIndex !== null) siteCtx.levelIndex = null
//   if (siteCtx.mode !== SiteCtxModeEnum.Enum.BUILDING)
//     siteCtx.mode = SiteCtxModeEnum.Enum.BUILDING
// }

// export const exitBuildingMode = () => {
//   if (siteCtx.levelIndex !== null) siteCtx.levelIndex = null
//   if (siteCtx.houseId !== null) siteCtx.houseId = null
//   if (siteCtx.mode !== SiteCtxModeEnum.Enum.SITE)
//     siteCtx.mode = SiteCtxModeEnum.Enum.SITE
// }

// export const enterLevelMode = (levelIndex: number) => {
//   if (siteCtx.levelIndex !== levelIndex) siteCtx.levelIndex = levelIndex
//   if (siteCtx.mode !== SiteCtxModeEnum.Enum.LEVEL)
//     siteCtx.mode = SiteCtxModeEnum.Enum.LEVEL
// }

// export const upMode = () => {
//   const { houseId, mode } = siteCtx
//   if (mode === SiteCtxModeEnum.Enum.LEVEL && houseId) {
//     enterBuildingMode(houseId)
//     dispatchModeChange({
//       prev: SiteCtxModeEnum.Enum.LEVEL,
//       next: SiteCtxModeEnum.Enum.BUILDING,
//     })
//   } else if (mode === SiteCtxModeEnum.Enum.BUILDING) {
//     exitBuildingMode()
//     dispatchModeChange({
//       prev: SiteCtxModeEnum.Enum.BUILDING,
//       next: SiteCtxModeEnum.Enum.SITE,
//     })
//   }
// }

// export const downMode = (incoming: { levelIndex: number; houseId: string }) => {
//   const { mode } = siteCtx
//   if (mode === SiteCtxModeEnum.Enum.SITE) {
//     enterBuildingMode(incoming.houseId)
//     dispatchModeChange({
//       prev: SiteCtxModeEnum.Enum.SITE,
//       next: SiteCtxModeEnum.Enum.BUILDING,
//     })
//   } else if (mode === SiteCtxModeEnum.Enum.BUILDING) {
//     enterLevelMode(incoming.levelIndex)
//     dispatchModeChange({
//       prev: SiteCtxModeEnum.Enum.BUILDING,
//       next: SiteCtxModeEnum.Enum.LEVEL,
//     })
//   }
// }

const MODE_CHANGE_EVENT = "ModeChangeEvent"

export type ModeChangeEventDetail = {
  prev?: SiteCtxMode
  next: SiteCtxMode
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
