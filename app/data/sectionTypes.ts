import { proxy, ref, useSnapshot } from "valtio"
import { SectionType } from "../../server/data/sectionTypes"
import { trpc } from "../../src/utils/trpc"

const systemSectionTypes = proxy<Record<string, SectionType[]>>({})

export const useSystemSectionTypes = ({ systemId }: { systemId: string }) => {
  const snap = useSnapshot(systemSectionTypes) as typeof systemSectionTypes
  return snap?.[systemId] ?? []
}

export const useInitSystemSectionTypes = ({
  systemId,
}: {
  systemId: string
}) => {
  trpc.sectionTypes.useQuery(
    {
      systemId: systemId,
    },
    {
      onSuccess: (data) => {
        systemSectionTypes[systemId] = ref(data)
      },
    }
  )
  return useSystemSectionTypes({ systemId })
}

export default systemSectionTypes
