import dynamic from "next/dynamic"

const Locate = dynamic(() => import("./Locate"), { ssr: false })

const LocatePage = () => {
  return <Locate />
}

export default LocatePage
