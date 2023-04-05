import { trpc } from "~/client/trpc"
import { SpaceType } from "~/server/data/spaceTypes"

export const useSpaceTypes = (): SpaceType[] => {
  const { data = [] } = trpc.spaceTypes.useQuery()
  return data
}

export const useSystemSpaceTypes = ({
  systemId,
}: {
  systemId: string
}): SpaceType[] => {
  return useSpaceTypes().filter((x) => x.systemId === systemId)
}
