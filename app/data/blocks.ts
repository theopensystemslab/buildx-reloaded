import { proxy, ref, useSnapshot } from "valtio"
import { trpc } from "~/client/trpc"
import { Block } from "~/server/data/blocks"

const systemBlocks = proxy<Record<string, Block[]>>({})

export const useSystemBlocks = ({ systemId }: { systemId: string }) => {
  const snap = useSnapshot(systemBlocks) as typeof systemBlocks
  return snap?.[systemId] ?? []
}

export const useAllSystemBlocks = () => useSnapshot(systemBlocks)

export const useInitSystemBlocks = ({ systemId }: { systemId: string }) => {
  trpc.blocks.useQuery(
    {
      systemId: systemId,
    },
    {
      onSuccess: (data) => {
        systemBlocks[systemId] = ref(data)
      },
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  )
  return useSystemBlocks({ systemId })
}
