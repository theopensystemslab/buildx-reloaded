"use client"
import DataInit from "~/data/DataInit"
import GroupedApp from "~/design/ui-3d/grouped/GroupedApp"
import React from "react"
import dynamic from "next/dynamic"

const AppInit = dynamic(() => import("~/design/ui-3d/init/AppInit"), {
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
