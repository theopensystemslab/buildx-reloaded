import React, { Fragment, useState } from "react"
import IconButton from "./IconButton"
import SiteSidebar from "./SiteSidebar"
import { Add } from "@carbon/icons-react"
import { setSidebar, useGlobals } from "../hooks/globals"

const HtmlUi = () => {
  const { sidebar } = useGlobals()
  return (
    <Fragment>
      <div className="absolute top-0 right-0 z-10 flex items-center justify-center">
        <IconButton onClick={() => setSidebar(true)}>
          <div className="flex items-center justify-center">
            <Add size={32} />
          </div>
        </IconButton>
        {/* <IconButton onClick={() => setUniversalMenu(true)}>
          <Menu />
        </IconButton> */}
      </div>
      <SiteSidebar open={sidebar} close={() => void setSidebar(false)} />
    </Fragment>
  )
}

export default HtmlUi
