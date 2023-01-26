import { A } from "./functions"

export const { abs, min, max, ceil, floor, round, PI, sign, sqrt } = Math

// export { abs, min, max }

export const reverseV2 = ([x, y]: [number, number]): [number, number] => [y, x]

export const hamming = (a: string, b: string) => {
  if (a.length !== b.length) throw new Error("Hamming of different lengths")

  return A.zipWith(a.split(""), b.split(""), (a, b) =>
    abs(a.codePointAt(0)! - b.codePointAt(0)!)
  ).reduce((acc, v) => acc + v, 0)
}
