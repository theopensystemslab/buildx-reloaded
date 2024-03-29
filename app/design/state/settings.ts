import { proxy, useSnapshot } from "valtio"

type AppSettings = {
  mapEnabled: boolean
  sidebar: boolean
  groundPlaneEnabled: boolean
  verticalCuts: {
    width: boolean
    length: boolean
  }
  debug: boolean
}

const settings = proxy<AppSettings>({
  mapEnabled: false,
  sidebar: false,
  groundPlaneEnabled: true,
  verticalCuts: {
    width: false,
    length: false,
  },
  debug: false,
})

export const useDesignSettings = () => {
  return useSnapshot(settings)
}

export const setVerticalCuts = (input: string[]) => {
  settings.verticalCuts.width = input.includes("width")
  settings.verticalCuts.length = input.includes("length")
}

export const useVerticalCuts = () => {
  const { verticalCuts } = useDesignSettings() as typeof settings
  return [verticalCuts, setVerticalCuts] as const
}

export const setGroundPlaneEnabled = (b: boolean) => {
  settings.groundPlaneEnabled = b
}

export const setSidebar = (b: boolean) => {
  settings.sidebar = b
}

export default settings
