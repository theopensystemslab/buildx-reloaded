"use client"
import { pipe } from "fp-ts/lib/function"
import { proxy, ref, useSnapshot } from "valtio"
import { trpc } from "~/client/trpc"
import { Block } from "~/server/data/blocks"
import { allSystemIds } from "../../server/data/system"
import { O, R } from "../../src/utils/functions"

const blocksProxy = proxy<Record<string, Block[]>>({})

export const useSystemBlocks = ({ systemId }: { systemId: string }) => {
  const snap = useSnapshot(blocksProxy) as typeof blocksProxy
  return snap?.[systemId] ?? []
}

export const useAllSystemBlocks = () => useSnapshot(blocksProxy)

export const useInitSystemBlocks = (
  { systemIds }: { systemIds: string[] } = { systemIds: allSystemIds }
) => {
  trpc.blocks.useQuery(
    {
      systemIds,
    },
    {
      onSuccess: (data) => {
        for (const block of data) {
          pipe(
            blocksProxy,
            R.modifyAt(block.systemId, (blocks) => ref([...blocks, block])),
            O.getOrElse(() =>
              pipe(blocksProxy, R.upsertAt(block.systemId, [block]))
            )
          )
        }
      },
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  )
  return useAllSystemBlocks()
}
