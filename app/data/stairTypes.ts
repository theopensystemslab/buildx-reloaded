import { proxy, useSnapshot } from "valtio"
import { StairType } from "../../server/data/stairTypes"
import { trpc } from "~/client/trpc"

const systemStairTypes = proxy<Record<string, StairType[]>>({})

export const useSystemStairTypes = ({ systemId }: { systemId: string }) => {
  const snap = useSnapshot(systemStairTypes) as typeof systemStairTypes
  return snap?.[systemId] ?? []
}

export const useInitSystemStairTypes = ({ systemId }: { systemId: string }) => {
  trpc.systemStairTypes.useQuery(
    {
      systemId: systemId,
    },
    {
      onSuccess: (data) => {
        systemStairTypes[systemId] = data
      },
    }
  )
  return useSystemStairTypes({ systemId })
}

export default systemStairTypes
