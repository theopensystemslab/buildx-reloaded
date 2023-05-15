import { trpc } from "@/client/trpc"
import { SystemSettings } from "@/server/data/settings"

export const useSystemsSettings = (): SystemSettings[] => {
  const { data = [] } = trpc.settings.useQuery()
  return data
}

export const useSystemSettings = ({
  systemId,
}: {
  systemId: string
}): SystemSettings[] => {
  return useSystemsSettings().filter((x) => x.systemId === systemId)
}
