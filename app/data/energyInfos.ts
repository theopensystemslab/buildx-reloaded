import { trpc } from "@/client/trpc"
import { EnergyInfo } from "@/server/data/energyInfos"

export const useEnergyInfos = (): EnergyInfo[] => {
  const { data = [] } = trpc.energyInfos.useQuery()
  return data
}

export const useSystemEnergyInfos = ({
  systemId,
}: {
  systemId: string
}): EnergyInfo[] => {
  return useEnergyInfos().filter((x) => x.systemId === systemId)
}
