import { pipe } from "fp-ts/lib/function"
import { useEffect, useMemo, useRef, useState } from "react"
import { useAnalyseData } from "../../../analyse/state/data"
import {
  OrderListRow,
  useOrderListData,
} from "../../../build/order/useOrderListData"
import { House, housesToRecord, useHouses } from "../../../db/user"
import IconButton from "../../../ui/IconButton"
import { Analyse, Close } from "../../../ui/icons"
import { A, NEA, R, S } from "../../../utils/functions"
import { getModeBools, useSiteCtx, useSiteCurrency } from "../../state/siteCtx"
import MetricsCarousel, { Metric } from "./MetricsCarousel"
import css from "./MetricsWidget.module.css"

const MetricsWidget = () => {
  const { mode, houseId } = useSiteCtx()
  const { buildingMode } = getModeBools(mode)
  const { costs, embodiedCo2, byHouse, areas } = useAnalyseData()
  const currency = useSiteCurrency()

  const houses = useHouses()

  const buildingHouse: House | null = useMemo(() => {
    if (!houseId) return null
    return housesToRecord(houses)[houseId]
  }, [houseId, houses])

  const { orderListRows } = useOrderListData(
    buildingHouse ? [buildingHouse] : houses
  )

  const orderListRowsByHouse: Record<string, OrderListRow[]> = A.isNonEmpty(
    orderListRows
  )
    ? pipe(
        orderListRows,
        NEA.groupBy((x) => x.houseId)
      )
    : {}

  const houseChassisCosts = pipe(
    orderListRowsByHouse,
    R.map(A.reduce(0, (b, a) => b + a.totalCost))
  )

  const totalChassisCost = pipe(
    houseChassisCosts,
    R.reduce(S.Ord)(0, (b, a) => b + a)
  )

  const hasHouseBeenAdded = useRef(false)

  const [isOpen, setOpen] = useState(false)
  const toggleOpen = () => setOpen(!isOpen)

  useEffect(() => {
    if (houses.length === 1 && !hasHouseBeenAdded.current) {
      setOpen(true)
      hasHouseBeenAdded.current = true
    }
    if (houses.length === 0 && hasHouseBeenAdded.current) {
      hasHouseBeenAdded.current = false
    }
  }, [houses])

  const topMetrics: Metric[] = buildingMode
    ? [
        {
          label: "Estimated build cost",
          value: byHouse[houseId!].costs.total,
          displayFn: (value) =>
            value.toLocaleString("en-GB", {
              style: "currency",
              currency: currency.code,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }),
        },
        {
          label: "Estimated chassis cost",
          value: houseChassisCosts[houseId!],
          displayFn: (value) =>
            value.toLocaleString("en-GB", {
              style: "currency",
              currency: currency.code,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }),
        },
      ]
    : [
        {
          label: "Estimated build cost",
          value: costs.total,
          displayFn: (value) =>
            value.toLocaleString("en-GB", {
              style: "currency",
              currency: currency.code,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }),
        },
        {
          label: "Estimated chassis cost",
          value: totalChassisCost,
          displayFn: (value) =>
            value.toLocaleString("en-GB", {
              style: "currency",
              currency: currency.code,
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }),
        },
      ]

  const bottomMetrics: Metric[] = buildingMode
    ? [
        {
          label: "Estimated carbon cost",
          value: byHouse[houseId!].embodiedCo2.total / 1000,
          unit: "tCO₂e",
          displayFn: (value, unit) => `${value.toFixed(2)} ${unit}`,
        },
        {
          label: "Internal floor area",
          value: byHouse[houseId!].areas.totalFloor,
          unit: "m²",

          displayFn: (value, unit) => `${value.toFixed(2)} ${unit}`,
        },
      ]
    : [
        {
          label: "Estimated carbon cost",
          value: embodiedCo2.total / 1000,
          unit: "tCO₂e",
          displayFn: (value, unit) => `${value.toFixed(2)} ${unit}`,
        },
        {
          label: "Internal floor area",
          value: areas.totalFloor,
          unit: "m²",

          displayFn: (value, unit) => `${value.toFixed(2)} ${unit}`,
        },
      ]

  return (
    <div className={css.root}>
      {!isOpen && (
        <IconButton
          onClick={toggleOpen}
          // className={clsx(iconButtonStyles, "bg-white hover:bg-white")}
        >
          <div className="flex items-center justify-center">
            <Analyse />
          </div>
        </IconButton>
      )}

      {isOpen && (
        <div className="relative">
          {/* <button
            className="absolute top-0 right-0 px-3 py-2 bg-red-200 rounded"
            onClick={toggleOpen}
          >
            {"X"}
          </button> */}

          <div className="absolute top-0 right-0 flex items-center mt-1 justify-end">
            <button className="w-8" onClick={toggleOpen}>
              <Close />
            </button>
            {/* <IconButton onClick={toggleOpen}>
              <Close />
            </IconButton> */}
          </div>
          <div className="pt-10 pb-6 pr-6">
            <MetricsCarousel metrics={topMetrics} />
            <MetricsCarousel metrics={bottomMetrics} />
          </div>
        </div>
      )}
    </div>
  )
}

export default MetricsWidget
