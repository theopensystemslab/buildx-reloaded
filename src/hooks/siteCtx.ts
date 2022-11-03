import { BUILDX_LOCAL_STORAGE_CONTEXT_KEY } from "@/constants"
import { useEffect } from "react"
import { proxy, subscribe, useSnapshot } from "valtio"
import * as z from "zod"
import { guardNotNullish } from "../utils/functions"
import { isSSR } from "../utils/next"
import houses from "./houses"

export const EditModeEnum = z.enum(["MOVE_ROTATE", "STRETCH"])
export type EditMode = z.infer<typeof EditModeEnum>

type SiteCtx = {
  buildingHouseId: string | null
  levelIndex: number | null
  editMode: EditMode | null
  projectName: string | null
  region: "UK" | "EU"
}

const defaults = {
  buildingId: null,
  levelIndex: null,
  editMode: EditModeEnum.Enum.MOVE_ROTATE,
  projectName: null,
  region: "EU",
}

export const getInitialSiteCtx = () =>
  isSSR()
    ? defaults
    : JSON.parse(
        localStorage.getItem(BUILDX_LOCAL_STORAGE_CONTEXT_KEY) ??
          JSON.stringify(defaults)
      )

const siteCtx = proxy<SiteCtx>(getInitialSiteCtx())

export const useSiteCtx = () => useSnapshot(siteCtx)

export const useIsBuilding = (houseId: string) => {
  const { buildingHouseId } = useSiteCtx()
  return houseId === buildingHouseId
}

export const useLocallyStoredSiteCtx = () =>
  useEffect(
    () =>
      subscribe(siteCtx, () => {
        localStorage.setItem(
          BUILDX_LOCAL_STORAGE_CONTEXT_KEY,
          JSON.stringify(siteCtx)
        )
      }),
    []
  )

export const useProjectName = () => {
  const ctx = useSnapshot(siteCtx)
  const { projectName } = ctx
  if (projectName === null || projectName.length <= 0) return "New project"
  else return projectName
}

export const SiteCtxModeEnum = z.enum(["SITE", "BUILDING", "LEVEL"])
export type SiteCtxMode = z.infer<typeof SiteCtxModeEnum>

export const useSiteCtxMode = (): SiteCtxMode => {
  const { buildingHouseId: buildingId, levelIndex } = useSiteCtx()

  return guardNotNullish(levelIndex)
    ? SiteCtxModeEnum.Enum.LEVEL
    : guardNotNullish(buildingId)
    ? SiteCtxModeEnum.Enum.BUILDING
    : SiteCtxModeEnum.Enum.SITE
}

export const useEditMode = (): EditMode | null => {
  const { editMode } = useSiteCtx()
  return editMode
}

export const enterBuildingMode = (buildingId: string) => {
  if (siteCtx.buildingHouseId !== buildingId)
    siteCtx.buildingHouseId = buildingId
  if (siteCtx.levelIndex !== null) siteCtx.levelIndex = null
  if (siteCtx.editMode !== EditModeEnum.Enum.STRETCH)
    siteCtx.editMode = EditModeEnum.Enum.STRETCH
}

export const exitBuildingMode = () => {
  if (siteCtx.levelIndex !== null) siteCtx.levelIndex = null
  if (siteCtx.buildingHouseId !== null) siteCtx.buildingHouseId = null
  if (siteCtx.editMode !== null) siteCtx.editMode = null
}

export const enterLevelMode = (levelIndex: number) => {
  if (siteCtx.levelIndex !== levelIndex) siteCtx.levelIndex = levelIndex
}

export const useSiteCurrency = () => {
  const { region } = useSiteCtx()
  return {
    symbol: region === "UK" ? "£" : "€",
    code: region === "UK" ? "GBP" : "EUR",
  }
}

export const useSystemId = () => {
  const { buildingHouseId: buildingId } = useSiteCtx()
  if (buildingId === null) return null
  return houses[buildingId].systemId
}

export default siteCtx
