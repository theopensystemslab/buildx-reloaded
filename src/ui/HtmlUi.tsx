import React, { useState } from "react"
import SiteSidebar from "./SiteSidebar"

const HtmlUi = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  return (
    <div>
      <SiteSidebar
        open={sidebarOpen}
        close={() => void setSidebarOpen(false)}
      />
    </div>
  )
}

export default HtmlUi
