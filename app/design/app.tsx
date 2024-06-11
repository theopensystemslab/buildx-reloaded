"use client"
import {
  BuildXScene,
  cachedHouseTypesTE,
  houseGroupTE,
} from "@opensystemslab/buildx-core"
import { flow, pipe } from "fp-ts/lib/function"
import { Fragment, useEffect, useRef } from "react"
import { useKey } from "react-use"
import { A, TE } from "~/utils/functions"
import HtmlUi from "./ui/HtmlUi"

let scene: BuildXScene | null = null

export const getBuildXScene = (): BuildXScene | null => {
  return scene
}

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current || scene !== null) return

    scene = new BuildXScene(canvasRef.current)
  }, [])

  useKey("h", () => {
    console.log("h")
    pipe(
      cachedHouseTypesTE,
      TE.chain(
        flow(
          A.lookup(0),
          TE.fromOption(() => Error())
        )
      ),
      TE.chain(({ systemId, dnas, name, id }) =>
        houseGroupTE({
          systemId,
          dnas,
          houseId: name,
          houseTypeId: id,
          friendlyName: name,
        })
      ),
      TE.map((houseGroup) => {
        scene?.addHouseGroup(houseGroup)
        console.log("hey")
      })
    )()
  })

  return (
    <Fragment>
      <canvas className="w-full h-full" ref={canvasRef} />
      <HtmlUi />
    </Fragment>
  )
}

export default App
