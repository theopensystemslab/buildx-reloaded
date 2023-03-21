"use client"
import DataInit from "~/server/data/DataInit"
import GroupedApp from "@/ui-3d/grouped/GroupedApp"
import AppInit from "@/ui-3d/init/AppInit"
import React from "react"

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
