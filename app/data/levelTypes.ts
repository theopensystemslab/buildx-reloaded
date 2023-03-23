import { proxy, useSnapshot } from "valtio"
import { LevelType } from "../../server/data/levelTypes"
import { trpc } from "~/client/trpc"

const levelTypes = proxy<Record<string, LevelType[]>>({})

export const useSystemLevelTypes = ({ systemId }: { systemId: string }) => {
  const snap = useSnapshot(levelTypes) as typeof levelTypes
  return snap?.[systemId] ?? []
}

export const useInitSystemLevelTypes = ({ systemId }: { systemId: string }) => {
  trpc.systemLevelTypes.useQuery(
    {
      systemId: systemId,
    },
    {
      onSuccess: (data) => {
        levelTypes[systemId] = data
      },
    }
  )
  return useSystemLevelTypes({ systemId })
}

export default levelTypes
