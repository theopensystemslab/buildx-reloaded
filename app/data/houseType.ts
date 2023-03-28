import { trpc } from "~/client/trpc"

export const useSystemHouseTypes = ({ systemId }: { systemId: string }) =>
  trpc.houseTypes.useQuery({
    systemId: systemId,
  }).data ?? []

export const useAllHouseTypes = () => trpc.allHouseTypes.useQuery()
