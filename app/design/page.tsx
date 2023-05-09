import DataInit from "~/app/data/DataInit"
import GroupedApp from "@/ui-3d/grouped/GroupedApp"
import AppInit from "./components/AppInit"

const IndexPage = () => {
  return (
    <DataInit>
      <AppInit controlsEnabled={true} mapEnabled={false}>
        <GroupedApp />
      </AppInit>
    </DataInit>
  )
}

export default IndexPage
