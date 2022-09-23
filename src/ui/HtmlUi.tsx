import React, { Fragment, useState } from "react"
import IconButton from "./IconButton"
import SiteSidebar from "./SiteSidebar"
import { Add } from "@carbon/icons-react"

const HtmlUi = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  return (
    <Fragment>
      <div className="absolute top-0 right-0 z-10 flex items-center justify-center">
        <IconButton onClick={() => setSidebarOpen(true)}>
          <div className="flex items-center justify-center">
            <Add size={32} />
          </div>
        </IconButton>
        {/* <IconButton onClick={() => setUniversalMenu(true)}>
          <Menu />
        </IconButton> */}
      </div>
      <SiteSidebar
        open={sidebarOpen}
        close={() => void setSidebarOpen(false)}
      />
    </Fragment>
  )
}

export default HtmlUi
