import { useEffect, useMemo, useState } from "react"
import { Color, DoubleSide } from "three"
import { useGlobals } from "../hooks/globals"

const HandleMaterial = () => {
  const white = useMemo(() => new Color("white"), [])
  const black = useMemo(() => new Color("black"), [])
  const [color, setColor] = useState(white)
  const { shadows } = useGlobals()

  useEffect(() => {
    if (shadows) {
      setColor(white)
    } else {
      setColor(black)
    }
  }, [black, shadows, white])

  return (
    <meshStandardMaterial color={color} emissive={color} side={DoubleSide} />
  )
}

export default HandleMaterial
