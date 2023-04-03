"use client"
import { trpc } from "~/client/trpc"
import { Block } from "~/server/data/blocks"

export const useBlocks = (): Block[] => {
  const { data = [] } = trpc.blocks.useQuery()
  return data
}

export const useSystemBlocks = ({
  systemId,
}: {
  systemId: string
}): Block[] => {
  return useBlocks().filter((x) => x.systemId === systemId)
}
