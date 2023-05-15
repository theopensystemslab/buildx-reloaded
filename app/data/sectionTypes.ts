import { trpc } from "@/client/trpc"
import { SectionType } from "../../server/data/sectionTypes"

export const useSectionTypes = (): SectionType[] => {
  const { data = [] } = trpc.sectionTypes.useQuery()
  return data
}

export const useSystemSectionTypes = ({
  systemId,
}: {
  systemId: string
}): SectionType[] => {
  return useSectionTypes().filter((x) => x.systemId === systemId)
}
