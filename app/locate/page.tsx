import dynamic from "next/dynamic"

const Locate = dynamic(() => import("@/ui/locate/LocateIndex"), {
  ssr: false,
})

const LocatePage = () => {
  return <Locate />
}

export default LocatePage
