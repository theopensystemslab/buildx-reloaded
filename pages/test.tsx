import { trpc } from "@/utils/trpc"

const TestPage = () => {
  const foo = trpc.systemModules.useQuery(
    {
      systemId: "skylark",
    },
    {
      onSuccess: (data) => {
        // systemModules[systemId] = data
        console.log({ data })
      },
      // refetchOnMount: true,
      // refetchOnWindowFocus: false,
      // refetchOnReconnect: false,
    }
  )
  return <pre>{JSON.stringify(foo, null, 2)}</pre>
}

export default TestPage
