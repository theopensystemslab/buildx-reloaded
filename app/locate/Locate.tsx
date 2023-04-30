"use client"
import HtmlPortalContainer from "../../src/ui/common/HtmlPortalContainer"
import GeocoderControl from "./GeocoderControl"
import css from "./Locate.module.css"
import Map from "./Map"
import PolygonControl from "./PolygonControl"

const Locate = () => {
  const leftMenuContainerId = "left-menu-container"
  const topLeftContainerId = "top-left-container-id"

  return (
    <div className={css.root}>
      <Map>
        <GeocoderControl {...{ leftMenuContainerId }} />
        <PolygonControl {...{ leftMenuContainerId, topLeftContainerId }} />
      </Map>
      <HtmlPortalContainer
        id={topLeftContainerId}
        className={css.topLeftContainer}
      />
      <div className={css.leftMenuContainer}>
        <HtmlPortalContainer id={leftMenuContainerId} />
      </div>
    </div>
  )
}

export default Locate
