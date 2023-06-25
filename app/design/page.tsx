import DataInit from "~/data/DataInit"
import { TrpcProvider } from "../ui/TrpcProvider"
import AppInit from "./ui-3d/init/AppInit"
import ProppedApp from "./ui-3d/propped/ProppedApp"

const IndexPage = () => {
  return (
    <TrpcProvider>
      <DataInit>
        <AppInit controlsEnabled={true} mapEnabled={false}>
          <ProppedApp />
        </AppInit>
      </DataInit>
    </TrpcProvider>
  )
}

export default IndexPage
