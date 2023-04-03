import { trpc } from "~/client/trpc"
import { WindowType } from "../../server/data/windowTypes"

export const useWindowTypes = (): WindowType[] => {
  const { data = [] } = trpc.windowTypes.useQuery()
  return data
}

export const useSystemWindowTypes = ({
  systemId,
}: {
  systemId: string
}): WindowType[] => {
  return useWindowTypes().filter((x) => x.systemId === systemId)
}
