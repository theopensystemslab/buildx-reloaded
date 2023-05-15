export const isSSR = () => typeof window === "undefined"

export const getBaseUrl = (): string => {
  if (typeof window !== "undefined")
    // browser should use relative path
    return ""

  if (process.env.SITE_NAME) {
    // reference for netlify.app
    const baseUrl = `https://${process.env.SITE_NAME}.netlify.app`
    return baseUrl
  }

  if (process.env.VERCEL_URL)
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}`

  if (process.env.RENDER_INTERNAL_HOSTNAME)
    // reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`

  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`
}
