import * as A from "fp-ts/Array"
import { flow, identity, pipe } from "fp-ts/lib/function"
import * as Mon from "fp-ts/Monoid"
import * as Num from "fp-ts/number"
import * as O from "fp-ts/Option"
import { clamp } from "fp-ts/Ord"
import * as RA from "fp-ts/ReadonlyArray"
import * as R from "fp-ts/Record"
import * as S from "fp-ts/string"

const clamp_ = clamp(Num.Ord)

export * as M from "fp-ts/Map"
export * as NEA from "fp-ts/NonEmptyArray"
export * as Ord from "fp-ts/Ord"
export * as RM from "fp-ts/ReadonlyMap"
export * as RNEA from "fp-ts/ReadonlyNonEmptyArray"
export * as RR from "fp-ts/ReadonlyRecord"
export * as SG from "fp-ts/Semigroup"
export { clamp_ as clamp }
export { A, Num, O, R, RA, S }

export const any = (...args: boolean[]) =>
  args.reduce((acc, v) => acc || v, false)
export const all = (...args: boolean[]) =>
  args.reduce((acc, v) => acc && v, true)
// export const all = concatAll(MonoidAll)

export const mapToOption =
  <A, B>(f: (a: A) => O.Option<B>) =>
  (fa: Array<A>): O.Option<Array<B>> => {
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
) => (fa: Array<A>) => O.Option<B> = (b, f) => (fa) => {
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

export const pipeLog = <T extends unknown>(t: T): T => (console.log(t), t)

export const pipeLogWith =
  <T extends unknown>(f: (t: T) => void) =>
  (t: T): T => {
    console.log(f(t))
    return t
  }

export const pipeEffect =
  <T extends unknown>(f: (t: T) => void) =>
  (t: T): T => {
    f(t)
    return t
  }

export const upperFirst = flow(
  S.split(""),
  RA.modifyAt(0, S.toUpperCase),
  O.map(Mon.concatAll(S.Monoid))
)

export const objComp = (a: Record<string, any>, b: Record<string, any>) =>
  pipe(
    R.keys(a),
    A.reduce(true, (acc, k) => acc && a[k] === b[k])
  )
