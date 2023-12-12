import { Fragment, PropsWithChildren } from "react"
import css from "./chartComponents.module.css"

export const ChartColumn = ({ children }: PropsWithChildren<{}>) => (
  <div className={css.chartColumn}>{children}</div>
)

export const ChartTitles = ({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) => (
  <Fragment>
    <h2>{title}</h2>
    <h5>{subtitle}</h5>
  </Fragment>
)

export const ChartContainer = ({ children }: PropsWithChildren<{}>) => (
  <div className={css.chartContainer}>{children}</div>
)

export const ChartMetrics = ({ children }: PropsWithChildren<{}>) => (
  <div className={css.chartMetrics}>{children}</div>
)

export const ChartMetrics2 = ({ children }: PropsWithChildren<{}>) => (
  <div className={css.chartMetrics2}>{children}</div>
)

export const WhatIsThis = ({ children }: PropsWithChildren<{}>) => (
  <div className={css.whatIsThis}>
    <h4>What is this?</h4>
    {children}
  </div>
)

export const HowIsItCalculated = ({ children }: PropsWithChildren<{}>) => (
  <div className={css.howIsItCalculated}>
    <h4>How is it calculated?</h4>
    {children}
  </div>
)
