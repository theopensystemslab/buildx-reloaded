import dynamic from "next/dynamic"
import "mapbox-gl/dist/mapbox-gl.css"

const App = dynamic(() => import("./app"), { ssr: false })

const IndexPage = () => {
  return <App />
}

export default IndexPage
