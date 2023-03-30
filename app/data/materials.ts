import { trpc } from "~/client/trpc"
import { Material } from "../../server/data/materials"

export const useMaterials = (): Material[] => {
  const { data = [] } = trpc.materials.useQuery()
  return data
}

export const useSystemMaterials = ({
  systemId,
}: {
  systemId: string
}): Material[] => {
  return useMaterials().filter((x) => x.systemId === systemId)
}
