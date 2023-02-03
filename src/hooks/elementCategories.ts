import { proxy, useSnapshot } from "valtio"

const elementCategories = proxy<{ [k: string]: boolean }>({})

export const useElementCategories = () => {
  const categories = useSnapshot(elementCategories)
  return categories
}

export default elementCategories
