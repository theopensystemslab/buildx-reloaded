import dynamic from "next/dynamic"

const App = dynamic(() => import("./app"), { ssr: false })

const IndexPage = () => {
  return <App />
}

export default IndexPage
