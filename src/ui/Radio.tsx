import type { ReactElement } from "react"
import React from "react"

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

  // const hoverStream = useStream<T | null>()

  // useEffect(() => {
  //   const hoverStreamProcessed = hoverStream.stream
  //     .compose(debounce(100))
  //     .compose(dropRepeats((x, y) => x === y))
  //   const streamListener: Partial<Listener<T | null>> = {
  //     next: (newHovered) => {
  //       props.onHoverChange && props.onHoverChange(newHovered)
  //     },
  //   }
  //   hoverStreamProcessed.addListener(streamListener)
  //   return () => {
  //     hoverStreamProcessed.removeListener(streamListener)
  //   }
  // }, [hoverStream.stream])

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
            className="flex w-full cursor-pointer items-center justify-between hover:bg-gray-100"
            // onMouseOver={() => {
            //   hoverStream.sendNext(option.value)
            // }}
            // onMouseOut={() => {
            //   hoverStream.sendNext(null)
            // }}
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
                  checked ? "bg-green-400" : "bg-gray-300"
                }`}
              ></div>
            </div>
          </label>
        )
      })}
    </div>
  )
}
