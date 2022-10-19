const { abs, min, max } = Math

export { abs, min, max }

export const reverseV2 = ([x, y]: [number, number]): [number, number] => [y, x]

export const addV3 = (a: V3, b: V3): [number, number, number] => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
]
