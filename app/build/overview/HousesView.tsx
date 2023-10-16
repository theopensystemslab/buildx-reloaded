"use client"
import DataInit from "~/data/DataInit"
import AppInit from "../../design/ui-3d/init/AppInit"
import FreshApp from "../../design/ui-3d/fresh/FreshApp"

const HousesView = () => {
  return (
    <DataInit>
      <AppInit controlsEnabled={false} mapEnabled={false}>
        <FreshApp />
      </AppInit>
    </DataInit>
  )
}

export default HousesView
