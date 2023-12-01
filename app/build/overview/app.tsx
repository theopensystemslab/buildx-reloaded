"use client"
import { ArrowDown } from "@carbon/icons-react"
import { pipe } from "fp-ts/lib/function"
import JSZip from "jszip"
import dynamic from "next/dynamic"
import { Fragment, useEffect, useState } from "react"
import { A } from "~/utils/functions"
import { useAnalyseData } from "../../analyse/state/data"
import {
  useOrderListData,
  useSelectedHouseMaterialsListRows,
} from "../../db/exports"
import { useSiteCurrency } from "../../design/state/siteCtx"
import {
  useModelsZipURL,
  useSelectedHouseModelBlobs,
} from "../../workers/exporters/hook"
import { useMaterialsListDownload } from "../materials/MaterialsListTable"
import { useOrderListDownload } from "../order/OrderListTable"
import css from "./app.module.css"

const HousesView = dynamic(() => import("./HousesView"), { ssr: false })

const OverviewIndex = () => {
  const { formatWithSymbol } = useSiteCurrency()

  const {
    areas: { totalFloor },
    costs: { superstructure, total },
    operationalCo2: { lifetime },
  } = useAnalyseData()

  const { orderListRows } = useOrderListData()

  const materialsListRows = useSelectedHouseMaterialsListRows()

  const orderListDownload = useOrderListDownload(orderListRows)

  const materialsListDownload = useMaterialsListDownload(materialsListRows)

  const modelsDownloadUrl = useModelsZipURL()

  const selectedHouseBlobs = useSelectedHouseModelBlobs()

  const [allFilesUrl, setAllFilesUrl] = useState<string | null>(null)

  useEffect(() => {
    const zip = new JSZip()

    if (orderListDownload) zip.file(`order-list.csv`, orderListDownload.blob)
    if (materialsListDownload)
      zip.file(`materials-list.csv`, materialsListDownload.blob)
    for (let [filename, blob] of selectedHouseBlobs) {
      zip.file(filename, blob)
    }

    zip.generateAsync({ type: "blob" }).then(function (content) {
      setAllFilesUrl(URL.createObjectURL(content))
    })
  }, [orderListDownload, materialsListDownload, selectedHouseBlobs])

  const overviewFields = [
    {
      label: "Total floor area",
      value: `${totalFloor.toFixed(1)}m²`,
    },
    {
      label: (
        <div>
          <div>Total estimated WikiHouse chassis cost</div>
          <div className="text-grey-50">
            Includes structure and insulation. Does not include shipping.
          </div>
        </div>
      ),
      value: formatWithSymbol(superstructure),
    },
    {
      label: "Total estimated build cost",
      value: formatWithSymbol(total),
    },
    {
      label: "Total estimated carbon cost",
      value: `${lifetime.toFixed(0)} tCO₂`,
    },
  ]

  return (
    <Fragment>
      {/* <div className="w-full h-full"> */}
      <div className="relative w-full h-96">
        <HousesView />
      </div>
      <div
        // className="grid grid-cols-2"
        className={css.markupGrid}
      >
        <div>
          <h2 className="p-4">Overview</h2>
          <div className="flex flex-col">
            {pipe(
              overviewFields,
              A.mapWithIndex((i, { label, value }) => (
                <div
                  key={i}
                  className="flex justify-between border-t border-grey-20 px-3 py-3"
                >
                  <div>{label}</div>
                  <div>{value}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="relative">
          <h2>Downloads</h2>

          <div className="flex flex-col space-y-4 mt-4">
            {modelsDownloadUrl && (
              <a
                href={modelsDownloadUrl}
                download={`3d-models.zip`}
                // className="flex font-semibold items-center"
              >
                <div className="flex font-semibold tracking-wide">
                  <span>Download 3D models</span>
                  <span>
                    <ArrowDown
                      width="1em"
                      height="1em"
                      className="ml-2 translate-y-[15%]"
                    />
                  </span>
                </div>
              </a>
            )}
            {orderListDownload && (
              <a
                href={orderListDownload.url}
                download={`order-list.csv`}
                // className="flex font-semibold items-center"
              >
                <div className="flex font-semibold tracking-wide">
                  <span>Download order list</span>
                  <span>
                    <ArrowDown
                      width="1em"
                      height="1em"
                      className="ml-2 translate-y-[15%]"
                    />
                  </span>
                </div>
              </a>
            )}
            {materialsListDownload && (
              <a
                href={materialsListDownload.url}
                download={`materials-list.csv`}
                // className="flex font-semibold items-center"
              >
                <div className="flex font-semibold tracking-wide">
                  <span>Download list of materials</span>
                  <span>
                    <ArrowDown
                      width="1em"
                      height="1em"
                      className="ml-2 translate-y-[15%]"
                    />
                  </span>
                </div>
              </a>
            )}
          </div>
          {allFilesUrl && (
            <a href={allFilesUrl}>
              <div className="absolute bottom-0 right-0 w-full bg-grey-20 px-3 py-3 font-semibold flex justify-between pb-12 tracking-wide">
                <div>Download all project files</div>
                <ArrowDown size="20" className="ml-8" />
              </div>
            </a>
          )}
        </div>
        <div className="relative">
          <h2>{`Want some help?`}</h2>
          <p>
            If you want a more customised chassis design, or custom blocks, we
            offer a chassis design service.
          </p>
          <p>
            You can also connect with project designers, structural engineers
            and installers to help you realise your project.
          </p>
          <a href="">
            <div className="absolute bottom-0 right-0 bg-grey-20 px-5 py-3 font-semibold flex justify-between pb-12 tracking-wide">
              <div>Get help with your project</div>
              <ArrowDown size="20" className="ml-8 rotate-[225deg]" />
            </div>
          </a>
        </div>
        <div className="relative">
          <h2>Find a manufacturer</h2>
          <p>
            Search for WikiHouse manufacturer to fabricate your WikiHouse
            blocks. Send them your order list to request a quote.
          </p>
          <a href="">
            <div className="absolute bottom-0 right-0 bg-grey-90 text-white px-5 py-3 font-semibold flex justify-between pb-12 tracking-wide">
              <div>Get a quote</div>
              <ArrowDown size="20" className="ml-8 rotate-[225deg]" />
            </div>
          </a>
        </div>
      </div>
      {/* </div> */}
    </Fragment>
  )
}

export default OverviewIndex
