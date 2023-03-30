import { trpc } from "~/client/trpc"
import { StairType } from "../../server/data/stairTypes"

export const useStairTypes = (): StairType[] => {
  const { data = [] } = trpc.windowTypes.useQuery()
  return data
}

export const useSystemStairTypes = ({
  systemId,
}: {
  systemId: string
}): StairType[] => {
  return useStairTypes().filter((x) => x.systemId === systemId)
}
