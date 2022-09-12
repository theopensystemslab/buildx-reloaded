import { useAllHouseTypes } from "../src/data/houseType"
import { useSystemModules } from "../src/hooks/modules"

export default function IndexPage() {
  // const { data: allHouseTypes } = useAllHouseTypes()
  const { data: skylarkModules } = useSystemModules({ systemId: "skylark" })

  if (!skylarkModules) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <pre>{JSON.stringify(skylarkModules, null, 2)}</pre>
    </div>
  )
}
