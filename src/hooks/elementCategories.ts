import { proxy, useSnapshot } from "valtio"

const elementCategories = proxy<{ [k: string]: boolean }>({
  // "Internal finishes": false,
  // "External finishes": false,
  // Insulation: false,
  // Services: false,
  // Structure: false,
  // "Windows & doors": false,
  // Foundations: false,
  // Furnishings: false,
})

export const useElementCategories = () => {
  const categories = useSnapshot(elementCategories)
  return categories
}

export default elementCategories
