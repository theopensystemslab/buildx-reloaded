import { PropsWithChildren } from "react"
import HtmlUi from "~/design/ui/HtmlUi"
import FullScreenContainer from "~/ui//FullScreenContainer"

type Props = PropsWithChildren<{
  mapEnabled: boolean
  controlsEnabled: boolean
}>

const AppInit = (props: Props) => {
  const { controlsEnabled, mapEnabled, children } = props

  return (
    <FullScreenContainer>
      {controlsEnabled && <HtmlUi />}
      {children}
    </FullScreenContainer>
  )
}

export default AppInit
