import React from "react"

interface Props {
  title: string
  blueValue: number
  greenValue: number
}

const Chart: React.FC<Props> = ({ title, blueValue, greenValue }) => {
  const totalValue = blueValue + greenValue
  const blueHeight = (blueValue / totalValue) * 100
  const greenHeight = (greenValue / totalValue) * 100
  return (
    <div className="flex flex-col items-center mr-8">
      <div className="text-lg font-medium mb-4">{title}</div>
      <div className="relative h-48 w-8 bg-gray-200 rounded-lg p-1">
        <div
          className="bg-green-500 absolute bottom-0 w-full"
          style={{ height: `${greenHeight}%` }}
        ></div>
        <div
          className="bg-blue-500 absolute top-0 w-full"
          style={{ height: `${blueHeight}%` }}
        ></div>
      </div>
      <div className="flex justify-between w-full text-xs text-gray-400 mt-2">
        <div>0k</div>
        <div>{totalValue}k</div>
      </div>
    </div>
  )
}

export default Chart
