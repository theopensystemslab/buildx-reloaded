import { ReactElement, useRef } from "react"
import { useDebouncedCallback } from "use-debounce"
import { useUnmountEffect } from "../utils/hooks"

interface Props<T> {
  selected: T
  options: Array<{
    label: string | ReactElement
    value: T
    thumbnail?: string
  }>
  onChange: (newSelected: T) => void
  onHoverChange?: (newHovered: T | null) => void
  id?: string
  label?: string
  compare?: (a: T, b: T) => boolean
}

export default function Radio<T>(props: Props<T>) {
  const anyThumbnails = props.options.reduce(
    (acc, v) => acc || Boolean(v.thumbnail),
    false
  )

  const lastT = useRef<T | null>(null)

  const newT = useDebouncedCallback(
    (maybeT: T | null) => {
      if (maybeT === lastT.current) return
      lastT.current = maybeT
      props.onHoverChange?.(maybeT)
    },
    100,
    { leading: true }
  )

  useUnmountEffect(() => {
    props.onHoverChange?.(null)
  })

  return (
    <div>
      {props.label && (
        <p className="select-none px-3 py-3 text-sm font-bold">{props.label}</p>
      )}
      {props.options.map((option, index) => {
        const checked = props.compare
          ? props.compare(option.value, props.selected)
          : option.value === props.selected

        return (
          <label
            key={index}
            htmlFor={`radio-${props.id}-${index}`}
            className="flex w-full cursor-pointer items-center justify-between hover:bg-grey-10"
            onMouseOver={() => {
              newT(option.value)
            }}
            onMouseOut={() => {
              newT(null)
            }}
          >
            <input
              type="radio"
              className="sr-only"
              id={`radio-${props.id}-${index}`}
              checked={checked}
              onChange={() => {
                props.onChange(option.value)
              }}
            />
            {anyThumbnails && (
              <div
                className="h-16 w-16 flex-none bg-cover bg-center"
                style={{ backgroundImage: `url(${option.thumbnail})` }}
              ></div>
            )}
            {typeof option.label === "string" ? (
              <p className="flex flex-1 px-3 py-2 text-sm">{option.label}</p>
            ) : (
              option.label
            )}
            <div className="flex h-[36px] w-[36px] items-center justify-center">
              <div
                className={`h-2.5 w-2.5 rounded-full transition-colors duration-500 ease-in-out ${
                  checked ? "bg-primary" : "bg-grey-30"
                }`}
              ></div>
            </div>
          </label>
        )
      })}
    </div>
  )
}
