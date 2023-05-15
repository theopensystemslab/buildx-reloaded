import { useRoute } from "@/utils/wouter"
import { useEffect, useRef } from "react"
import { useLocation } from "wouter"
import siteCtx, {
  enterBuildingMode,
  enterLevelMode,
  exitBuildingMode,
  getModeBools,
} from "~/app/design/state/siteCtx"
import { useSubscribe } from "../utils/hooks"

export const useRouting = () => {
  const [location, setLocation] = useLocation()
  const [, params] = useRoute<{ houseId: string; levelIndex?: string }>(
    "/design:rest*"
  )

  const urlChangingLock = useRef(false)

  useSubscribe(siteCtx, () => {
    if (urlChangingLock.current) return
    if (!location.startsWith("/design")) return

    const { buildingOrLevelMode, levelMode } = getModeBools(siteCtx.mode)

    let path = "/design"

    if (siteCtx.houseId && buildingOrLevelMode) {
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
    urlChangingLock.current = true

    if (params === null || typeof params === "boolean") return
    switch (true) {
      case "houseId" in params && siteCtx.houseId !== params.houseId: {
        enterBuildingMode(params.houseId!)
      }
      case "levelIndex" in params: {
        const levelIndex = Number(params.levelIndex)
        if (siteCtx.levelIndex === levelIndex || isNaN(levelIndex)) break
        enterLevelMode(levelIndex)
        break
      }
      case !("houseId" in params):
        exitBuildingMode()
    }

    urlChangingLock.current = false
  }, [params])
}
