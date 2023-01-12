import { DefaultParams, useRoute as useWouterRoute } from "wouter"

export const useRoute = <T extends DefaultParams>(pattern: string) => {
  let [match, params] = useWouterRoute<T>(pattern)
  if (match) {
    const urlSearchParams = new URLSearchParams(window.location.search)
    const queryParams = Object.fromEntries(urlSearchParams.entries())
    // params and queryParams can have the same name
    // this preferences params in that scenario
    return [
      match,
      {
        ...queryParams,
        ...params,
      },
    ]
  }
  return [match, params]
}
