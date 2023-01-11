import { PropsWithChildren } from "react"
import NavIconButton from "./NavIconButton"
import { Site, Build, Data, Files } from "./icons"

const Layout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className="fixed flex h-full w-full flex-col">
      <div className="relative h-full w-full">
        <div className="absolute top-0 left-1/2 z-10 flex -translate-x-1/2 transform justify-center bg-white shadow">
          <NavIconButton href="/map">
            <Site />
          </NavIconButton>
          <NavIconButton href="/site">
            <Build />
          </NavIconButton>
          <NavIconButton href="/dashboard">
            <Data />
          </NavIconButton>
          <NavIconButton href="/download">
            <Files />
          </NavIconButton>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Layout
