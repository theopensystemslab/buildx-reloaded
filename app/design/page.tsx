"use client"
import DataInit from "~/data/DataInit"
import { TrpcProvider } from "../ui/TrpcProvider"
import { getLayoutsWorker, getSystemsWorker } from "../workers"
import GroupedApp from "./ui-3d/grouped/GroupedApp"
import AppInit from "./ui-3d/init/AppInit"

const IndexPage = () => {
  getSystemsWorker()
  getLayoutsWorker()
  return (
    <TrpcProvider>
      <DataInit>
        <AppInit controlsEnabled={true} mapEnabled={false}>
          <GroupedApp />
        </AppInit>
      </DataInit>
    </TrpcProvider>
  )
}

export default IndexPage
