"use client"
import { ArrowDown } from "@carbon/icons-react"
import {
  useOrderListData,
  useProjectCurrency,
  useProjectData,
  useAnalysisData,
  SharingWorker,
} from "@opensystemslab/buildx-core"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { A } from "~/utils/functions"
import css from "./app.module.css"
import useDownloads from "./useDownloads"

new SharingWorker()

// const HousesView = dynamic(() => import("./HousesView"), { ssr: false })

const OverviewIndex = () => {
  const { format } = useProjectCurrency()

  const { projectName, shareUrlPayload } = useProjectData()

  const _typeformLink = `https://form.typeform.com/to/SVFFF12s?typeform-source=www.wikihouse.cc#source=configurator`

  const typeformLink =
    shareUrlPayload === null
      ? _typeformLink
      : `${_typeformLink}#url=${shareUrlPayload}`

  const _testLink = `https://form.typeform.com/to/zePfnP4K`

  const testLink =
    shareUrlPayload === null
      ? _testLink
      : `https://form.typeform.com/to/zePfnP4K#url=${shareUrlPayload}`

  const {
    areas: { totalFloor },
    embodiedCo2,
    costs: { total },
  } = useAnalysisData()

  const { totalTotalCost } = useOrderListData()

  const { allFilesZipURL, materialsListCsvURL, modelsZipURL, orderListCsvURL } =
    useDownloads()

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
      value: format(totalTotalCost),
    },
    {
      label: "Total estimated build cost",
      value: format(total),
    },
    {
      label: "Total estimated carbon cost",
      value: `${(embodiedCo2.total / 1000).toFixed(2)} tCO₂e`,
    },
  ]

  return (
    <Fragment>
      {/* <div className="relative w-full h-96">
        <HousesView />
      </div> */}
      <div className={css.markupGrid}>
        <div className="border-r border-grey-20">
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
            {modelsZipURL && (
              <a href={modelsZipURL} download={`3d-models.zip`}>
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
            {orderListCsvURL && (
              <a href={orderListCsvURL} download={`order-list.csv`}>
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
            {materialsListCsvURL && (
              <a href={materialsListCsvURL} download={`materials-list.csv`}>
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
          {allFilesZipURL && (
            <a
              href={allFilesZipURL}
              download={`${projectName ?? "all-files"}.zip`}
            >
              <div className="absolute bottom-0 right-0 w-full bg-grey-20 px-3 py-3 font-semibold flex justify-between pb-12 tracking-wide">
                <div>Download all project files</div>
                <ArrowDown size="20" className="ml-8" />
              </div>
            </a>
          )}
        </div>
        <div className="relative">
          <h2>{`Get started`}</h2>
          <p>
            Download your project files. You will want these to share with
            others later.
          </p>

          <p>
            Then tap ‘start your project’. We will ask you a series of questions
            about how you want to deliver your project.
          </p>

          <p>
            If we can, we will help connect you with designers, engineers,
            manufacturers or installers who will be able to give you exact
            quotes, and help make your project happen.
          </p>
        </div>
        <div className="relative">
          <a href={testLink} target="_blank" rel="noopener noreferrer">
            <div className="absolute bottom-0 right-0 w-full bg-grey-90 text-white px-5 py-3 font-semibold flex justify-between pb-12 tracking-wide">
              <div>Contact us about your project</div>
              <ArrowDown size="20" className="ml-8 rotate-[225deg]" />
            </div>
          </a>
        </div>
      </div>
    </Fragment>
  )
}

export default OverviewIndex
