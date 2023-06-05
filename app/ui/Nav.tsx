import { Analyse, Build, Design, Locate } from "./icons"
import NavIconButton from "./NavIconButton"

const Nav = () => {
  return (
    <div className={"w-full flex justify-between bg-white shadow items-center"}>
      <div id="headerStart" className="flex-1" />
      <div className="flex flex-none">
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
          icon={<Build />}
          order={4}
          label="Build"
          unpaddedSvg
        />
      </div>
      <div id="headerEnd" className="flex-1" />
    </div>
  )
}

export default Nav
