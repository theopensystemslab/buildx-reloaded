"use client"
import FreshApp from "../../design/ui-3d/fresh/FreshApp"
import AppInit from "../../design/ui-3d/init/AppInit"

const HousesView = () => {
  return (
    <AppInit controlsEnabled={false} mapEnabled={false}>
      <FreshApp />
    </AppInit>
  )
}

export default HousesView
