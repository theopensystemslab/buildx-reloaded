import tailwindConfig from "@/tailwind.config"
import { DoubleSide, MeshStandardMaterial } from "three"

const colors = {
  default: "white",
  alt:
    (tailwindConfig.theme?.extend?.colors as any)?.["grey"]?.["90"] ?? "black",
}

const color = colors.default

const handleMaterial = new MeshStandardMaterial({
  color,
  emissive: color,
  side: DoubleSide,
})

export default handleMaterial
