"use client"
import DataInit from "~/app/data/DataInit"
import GroupedApp from "~/app/design/ui-3d/grouped/GroupedApp"
import React from "react"
import dynamic from "next/dynamic"

const AppInit = dynamic(() => import("~/app/design/ui-3d/init/AppInit"), {
  ssr: false,
})

const HousesView = () => {
  return (
    <DataInit>
      <AppInit controlsEnabled={false} mapEnabled={false}>
        <GroupedApp />
      </AppInit>
    </DataInit>
  )
}

export default HousesView
