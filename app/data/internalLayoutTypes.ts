import { trpc } from "~/client/trpc"
import { InternalLayoutType } from "~/server/data/internalLayoutTypes"

export const useInternalLayoutTypes = (): InternalLayoutType[] => {
  const { data = [] } = trpc.internalLayoutTypes.useQuery()
  return data
}

export const useSystemInternalLayoutTypes = ({
  systemId,
}: {
  systemId: string
}): InternalLayoutType[] => {
  return useInternalLayoutTypes().filter((x) => x.systemId === systemId)
}
