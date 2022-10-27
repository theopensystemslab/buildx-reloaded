import React from "react"

interface Props<T> {
  selected: Array<T>
  options: Array<{ label: string; value: T }>
  onChange: (newSelected: Array<T>) => void
  label?: string
}

interface ChecklistButtonProps {
  active: boolean
  onClick?: () => void
}

function ChecklistButton(props: ChecklistButtonProps) {
  return (
    <div
      className={`flex h-5 w-5 flex-none items-center justify-center rounded ${
        props.onClick ? "cursor-pointer hover:bg-gray-100" : ""
      }`}
      onClick={props.onClick}
    >
      <div
        className={`h-2.5 w-2.5 flex-none rounded-[2px] transition-colors duration-500 ease-in-out ${
          props.active ? "bg-green-400" : "bg-gray-300"
        }`}
      ></div>
    </div>
  )
}

function Checklist<T>(props: Props<T>) {
  return (
    <div>
      {props.label && (
        <div className="flex items-center justify-between py-2 pl-3 pr-1">
          <p className="text-sm font-bold">{props.label}</p>
          {props.options.length > 5 && (
            <ChecklistButton
              active={props.selected.length > 0}
              onClick={() => {
                props.onChange(
                  props.selected.length === 0
                    ? props.options.map((option) => option.value)
                    : []
                )
              }}
            />
          )}
        </div>
      )}
      {props.options.map((option, index) => (
        <label
          key={index}
          className="flex w-full cursor-pointer items-center justify-between space-x-2 py-2 pl-3 pr-1 hover:bg-gray-100"
        >
          <p className="flex break-all text-sm">{option.label}</p>
          <ChecklistButton active={props.selected.includes(option.value)} />
          <input
            type="checkbox"
            className="sr-only"
            onChange={() => {
              if (props.selected.includes(option.value)) {
                props.onChange(
                  props.selected.filter((val) => val !== option.value)
                )
              } else {
                props.onChange([...props.selected, option.value])
              }
            }}
          />
        </label>
      ))}
    </div>
  )
}

export default Checklist
