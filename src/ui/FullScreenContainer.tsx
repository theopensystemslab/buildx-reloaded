import { HTMLProps } from "react"

const FullScreenContainer = ({
  className,
  ...props
}: HTMLProps<HTMLDivElement>) => (
  <div className={`absolute w-full h-full ${className}`} {...props} />
)

export default FullScreenContainer
