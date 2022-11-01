import { proxy, useSnapshot } from "valtio"
import { Element } from "../data/element"
import { trpc } from "../utils/trpc"

const systemElements = proxy<Record<string, Element[]>>({})

export const useSystemElements = ({ systemId }: { systemId: string }) => {
  const snap = useSnapshot(systemElements)
  return snap?.[systemId] ?? []
}

export const useInitSystemElements = ({ systemId }: { systemId: string }) => {
  trpc.systemElements.useQuery(
    {
      systemId: systemId,
    },
    {
      onSuccess: (data) => {
        systemElements[systemId] = data
      },
    }
  )
  return useSystemElements({ systemId })
}

export default systemElements
