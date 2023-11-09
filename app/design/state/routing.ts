"use client"
import { useRoute } from "~/utils/wouter"
import { useEffect, useRef } from "react"
import { useLocation } from "wouter"
import userDB, {
  SiteCtxModeEnum,
  dispatchModeChange,
  getSiteCtx,
  useSiteCtx,
  useSubscribeSiteCtx,
} from "~/db/user"
import { useSubscribe } from "~/utils/hooks"
import { liveQuery } from "dexie"

export const useRouting = () => {
  const [location, setLocation] = useLocation()
  const [, params] = useRoute<{ houseId: string; levelIndex?: string }>(
    "/design:rest*"
  )

  const urlChangingLock = useRef(false)

  useSubscribeSiteCtx((siteCtx) => {
    if (urlChangingLock.current) return
    if (!location.startsWith("/design")) return

    const { mode } = siteCtx
    const siteMode = mode === SiteCtxModeEnum.Enum.SITE
    const levelMode = mode === SiteCtxModeEnum.Enum.LEVEL

    let path = "/design"

    if (siteCtx.houseId && !siteMode) {
      path += `?houseId=${siteCtx.houseId}`
      if (levelMode) {
        path += `&levelIndex=${siteCtx.levelIndex}`
      }
    }

    if (path !== window.location.pathname + window.location.search) {
      setLocation(path)
    }
  })

  useEffect(() => {
    getSiteCtx().then((siteCtx) => {
      urlChangingLock.current = true
      const { mode: prev } = siteCtx

      if (params === null || typeof params === "boolean") return

      switch (true) {
        // LEVEL
        case "levelIndex" in params && "houseId" in params: {
          const levelIndex = Number(params.levelIndex)
          const houseId = String(params.houseId)

          if (isNaN(levelIndex)) break

          dispatchModeChange({
            prev,
            next: SiteCtxModeEnum.Enum.LEVEL,
            houseId,
            levelIndex,
          })
          break
        }
        // BUILDING
        case "houseId" in params: {
          const houseId = String(params.houseId)
          dispatchModeChange({
            prev,
            next: SiteCtxModeEnum.Enum.BUILDING,
            houseId,
          })
          break
        }
        // SITE
        case !("houseId" in params): {
          dispatchModeChange({
            prev,
            next: SiteCtxModeEnum.Enum.SITE,
          })
          break
        }
      }

      urlChangingLock.current = false
    })
  }, [params])
}

export const Routing = () => {
  useRouting()
  return null
}
