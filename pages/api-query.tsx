import { trpc } from "@/utils/trpc"

export default function IndexPage() {
  const { data } = trpc.modules.useQuery({ buildSystemId: "skylark" })

  if (!data) {
    return <div>Loading...</div>
  }
  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
