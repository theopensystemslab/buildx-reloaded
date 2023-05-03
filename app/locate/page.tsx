import dynamic from "next/dynamic"

const Locate = dynamic(() => import("./components/Locate"), { ssr: false })

const LocatePage = () => {
  return <Locate />
}

export default LocatePage
