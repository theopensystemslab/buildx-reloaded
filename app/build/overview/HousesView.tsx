"use client"
import DataInit from "~/data/DataInit"
import GroupedApp from "~/design/ui-3d/grouped/GroupedApp"
import AppInit from "../../design/ui-3d/init/AppInit"

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
