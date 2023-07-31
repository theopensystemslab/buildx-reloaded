import { invalidate } from "@react-three/fiber"
import { RefObject } from "react"
import { BoxGeometry, Group, Mesh, MeshBasicMaterial } from "three"
import { useSubscribeKey } from "../../../utils/hooks"
import { setVisibleOnly } from "../../../utils/three"
import siteCtx, { SiteCtxModeEnum } from "../../state/siteCtx"
import getUtils from "./util"

const useModeHandling = (rootRef: RefObject<Group>) => {
  const { applyToHouseRootGroup } = getUtils(rootRef)

  let i = 4

  useSubscribeKey(siteCtx, "mode", () => {
    const { mode, houseId, levelIndex } = siteCtx

    switch (mode) {
      case SiteCtxModeEnum.Enum.SITE:
        console.log("site mode")
        break
      case SiteCtxModeEnum.Enum.BUILDING:
        if (houseId)
          applyToHouseRootGroup(houseId, (houseRootGroup) => {
            const newMesh = new Mesh(
              new BoxGeometry(),
              new MeshBasicMaterial({ color: "red" })
            )
            newMesh.position.y = i
            i++
            console.log(i)
            houseRootGroup.add(newMesh)
          })
        invalidate()
        console.log("building mode")
        break
      case SiteCtxModeEnum.Enum.LEVEL:
        console.log("level mode")
        break
    }
  })
}

export default useModeHandling
