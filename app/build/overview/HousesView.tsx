"use client"
import DataInit from "~/app/data/DataInit"
import GroupedApp from "@/ui-3d/grouped/GroupedApp"
import React from "react"
import dynamic from "next/dynamic"

const AppInit = dynamic(() => import("../../design/components/AppInit"), {
  ssr: false,
})

const HousesView = () => {
  return (
    <DataInit>
      <AppInit>
        <GroupedApp />
      </AppInit>
    </DataInit>
  )
}

export default HousesView
