import React, { useState } from "react"
import SiteSidebar from "./SiteSidebar"

const HtmlUi = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  return (
    <div>
      <SiteSidebar open={sidebarOpen} close={() => void setSidebarOpen(true)} />
    </div>
  )
}

export default HtmlUi
