import { trpc } from "~/client/trpc"
import { LevelType } from "../../server/data/levelTypes"

export const useLevelTypes = (): LevelType[] => {
  const { data = [] } = trpc.levelTypes.useQuery()
  return data
}

export const useSystemLevelTypes = ({
  systemId,
}: {
  systemId: string
}): LevelType[] => {
  return useLevelTypes().filter((x) => x.systemId === systemId)
}
