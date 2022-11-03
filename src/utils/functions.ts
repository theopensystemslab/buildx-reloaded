import { identity } from "fp-ts/lib/function"
import * as O from "fp-ts/Option"
import * as RA from "fp-ts/ReadonlyArray"

export const any = (...args: boolean[]) =>
  args.reduce((acc, v) => acc || v, false)
export const all = (...args: boolean[]) =>
  args.reduce((acc, v) => acc && v, true)
// export const all = concatAll(MonoidAll)

export const mapToOption =
  <A, B>(f: (a: A) => O.Option<B>) =>
  (fa: ReadonlyArray<A>): O.Option<ReadonlyArray<B>> => {
    const fb = new Array<B>(fa.length)
    //                   ^?
    for (let i = 0; i < fa.length; i++) {
      const result = f(fa[i])
      if (O.isNone(result)) return O.none
      else fb[i] = result.value
    }
    return O.some(fb)
  }

export const reduceToOption: <A, B>(
  b: O.Option<B>,
  f: (i: number, b: O.Option<B>, a: A) => O.Option<B>
) => (fa: ReadonlyArray<A>) => O.Option<B> = (b, f) => (fa) => {
  const len = fa.length
  let out = b
  for (let i = 0; i < len; i++) {
    out = f(i, out, fa[i])
    if (O.isNone(out)) return O.none
  }
  return out
}

export const guardNotNullish = <T extends unknown>(
  val: T | null | undefined
): val is T => {
  if (val === null || val === undefined) {
    return false
  }
  return true
}

export const errorThrower = (message?: string) => () => {
  throw new Error(message)
}

export const someOrError = <T extends unknown>(message?: string) =>
  O.match<T, T>(errorThrower(message), identity)

export * as A from "fp-ts/Array"
export * as R from "fp-ts/Record"
export * as RNEA from "fp-ts/ReadonlyNonEmptyArray"
export * as RR from "fp-ts/ReadonlyRecord"
export * as RM from "fp-ts/ReadonlyMap"
export * as M from "fp-ts/Map"
export * as Ord from "fp-ts/Ord"
export * as S from "fp-ts/string"
export * as N from "fp-ts/number"

export { O, RA }
