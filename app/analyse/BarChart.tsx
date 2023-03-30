import React from "react"

type BarChartItem = {
  value: number
  color: string
  content: string
}

type Props = {
  data: BarChartItem[]
}

const BarChart = ({ data }: Props) => {
  // Find the maximum value to calculate the ratios
  const max = Math.max(...data.map((item) => item.value))

  // Map through the data array and create bars with height, background color, and content
  const bars = data.map((item) => (
    <div
      key={item.value}
      className="flex justify-center items-center px-5"
      style={{
        flex: `${item.value / max} 0 0`,
        backgroundColor: item.color,
      }}
    >
      {item.content}
    </div>
  ))

  // Return the bars wrapped in a container
  return <div className="flex flex-col h-full">{bars}</div>
}

export default BarChart
