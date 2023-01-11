import { PropsWithChildren } from "react"
import NavIconButton from "./NavIconButton"
import { Locate, Design, Data, Files, Analyse } from "./icons"

const Layout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className="fixed flex h-full w-full flex-col">
      <div className="relative h-full w-full">
        <div className="absolute w-full top-0 z-10 flex justify-center bg-white shadow">
          <NavIconButton
            href="/locate"
            icon={<Locate />}
            order={1}
            label="Locate"
          />
          <NavIconButton
            href="/design"
            icon={<Design />}
            order={2}
            label="Design"
          />
          <NavIconButton
            href="/analyse"
            icon={<Analyse />}
            order={3}
            label="Analyse"
            unpaddedSvg
          />
          <NavIconButton
            href="/build"
            icon={<Files />}
            order={4}
            label="Build"
          />
        </div>
        {children}
      </div>
    </div>
  )
}

export default Layout
