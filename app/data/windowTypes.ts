import { proxy, useSnapshot } from "valtio"
import { WindowType } from "../../server/data/windowTypes"
import { trpc } from "~/client/trpc"

const windowTypes = proxy<Record<string, WindowType[]>>({})

export const useSystemWindowTypes = ({ systemId }: { systemId: string }) => {
  const snap = useSnapshot(windowTypes) as typeof windowTypes
  return snap?.[systemId] ?? []
}

export const useInitSystemWindowTypes = ({
  systemId,
}: {
  systemId: string
}) => {
  trpc.windowTypes.useQuery(
    {
      systemId: systemId,
    },
    {
      onSuccess: (data) => {
        windowTypes[systemId] = data
      },
    }
  )
  return useSystemWindowTypes({ systemId })
}

export default windowTypes
