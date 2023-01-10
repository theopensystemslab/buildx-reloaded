import { PropsWithChildren } from "react"
import IconButton from "./IconButton"
import { Site, Build, Data, Files } from "./icons"

const Layout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className="fixed flex h-full w-full flex-col">
      <div className="relative h-full w-full">
        <div className="absolute top-0 left-1/2 z-10 flex -translate-x-1/2 transform justify-center bg-white shadow">
          <IconButton href="/map">
            <Site />
          </IconButton>
          <IconButton href="/site">
            <Build />
          </IconButton>
          <IconButton href="/dashboard">
            <Data />
          </IconButton>
          <IconButton href="/download">
            <Files />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Layout
