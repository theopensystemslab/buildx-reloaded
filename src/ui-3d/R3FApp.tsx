import { replicate } from "fp-ts/lib/Array"
import { pipe } from "fp-ts/lib/function"
import React from "react"

type M = {
  // incorporating blank space
  length: number // grid units
  height: number // grid units
  width: number // grid units
  matrix: boolean[][][]
}

const newM = ({
  length,
  height,
  width,
}: {
  length: number
  height: number
  width: number
}): M => ({
  length,
  width,
  height,
  matrix: pipe(
    replicate(length, false),
    (xs) => replicate(height, xs),
    (ys) => replicate(width, ys)
  ),
})

// const m1: M = {
//   length: 3,
//   width: 1,
//   height: 1,
//   spaceMatrix:
// }

// validate that the fillMatrix is actually l * w * h?

const lengthHeightToWidth1 = (input: boolean[][]): boolean[][][] => [input]

// maybe we pass lines of boolean
// lines of lines of boolean
// lines of lines of lines of boolean

const R3FApp = () => {
  const L = [
    [true, false, false],
    [true, true, true],
  ]

  console.log(newM({ length: 3, height: 2, width: 1 }))
  return (
    <mesh>
      <boxBufferGeometry />
      <meshBasicMaterial color="skyblue" />
    </mesh>
  )
}

export default R3FApp
