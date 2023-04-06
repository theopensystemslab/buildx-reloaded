import { trpc } from "~/client/trpc"
import { HouseType } from "~/server/data/houseTypes"

export const useHouseTypes = (): HouseType[] => {
  const { data = [] } = trpc.houseTypes.useQuery()
  return data
}

export const useSystemHouseTypes = ({
  systemId,
}: {
  systemId: string
}): HouseType[] => {
  return useHouseTypes().filter((x) => x.systemId === systemId)
}
