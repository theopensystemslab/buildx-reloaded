export const any = (...args: boolean[]) =>
  args.reduce((acc, v) => acc || v, false)
export const all = (...args: boolean[]) =>
  args.reduce((acc, v) => acc && v, true)
// export const all = concatAll(MonoidAll)

export * as A from "fp-ts/Array"
export * as R from "fp-ts/Record"
export * as RA from "fp-ts/ReadonlyArray"
export * as RNEA from "fp-ts/ReadonlyNonEmptyArray"
export * as RR from "fp-ts/ReadonlyRecord"
