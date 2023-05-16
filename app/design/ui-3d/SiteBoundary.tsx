"use client"
import { Line } from "@react-three/drei"
import { pipe } from "fp-ts/lib/function"
import { A } from "~/utils/functions"
import { useSiteBoundaryPoints } from "../state/boundary"

const SiteBoundary = () => {
  const height = 0.1
  const siteBoundaryPoints = pipe(
    useSiteBoundaryPoints(),
    A.map(([x, z]): [number, number, number] => [x, height, z])
  )

  return (
    <Line
      points={siteBoundaryPoints}
      lineWidth={2}
      // @ts-ignore
      color="#9D9D9D"
    />
  )
}

export default SiteBoundary
