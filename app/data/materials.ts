import { proxy, ref, useSnapshot } from "valtio"
import { Material } from "../../server/data/materials"
import { createMaterial } from "../../src/utils/three"
import { trpc } from "~/client/trpc"

const systemMaterials = proxy<Record<string, Material[]>>({})

export const useSystemMaterials = ({ systemId }: { systemId: string }) => {
  const snap = useSnapshot(systemMaterials) as typeof systemMaterials
  return snap?.[systemId] ?? []
}

export const useInitSystemMaterials = ({ systemId }: { systemId: string }) => {
  trpc.materials.useQuery(
    {
      systemId: systemId,
    },
    {
      onSuccess: (data) => {
        systemMaterials[systemId] = data
        systemMaterials[systemId].forEach((material) => {
          material.threeMaterial = ref(createMaterial(material))
        })
      },
    }
  )
  return useSystemMaterials({ systemId })
}
