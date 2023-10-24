"use client"
import { Fragment } from "react"
import AppInit from "~/design/ui-3d/init/AppInit"
import Leva from "../ui/Leva"
import DebugSystemApp from "./ui-3d/DebugSystemApp"

const DebugApp = () => {
  return (
    <Fragment>
      <AppInit controlsEnabled={true} mapEnabled={false}>
        <DebugSystemApp />
      </AppInit>
      <Leva />
    </Fragment>
  )
}

export default DebugApp
