"use client"
import { ArrowDown } from "@carbon/icons-react"
import { pipe } from "fp-ts/lib/function"
import { Fragment } from "react"
import { A } from "../../../src/utils/functions"
import HousesView from "./HousesView"
import css from "./page.module.css"

const OverviewIndex = () => {
  const overviewFields = [
    {
      label: "Total floor area",
      value: "160.3m²",
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
      value: "£80k",
    },
    {
      label: "Total estimated build cost",
      value: "£193k",
    },
    {
      label: "Total estimated carbon cost",
      value: "-12.2t CO₂",
    },
  ]

  const downloadLinks = [
    { href: "/foo", label: "Download 3D models" },
    { href: "/bar", label: "Download order list" },
    { href: "/ding", label: "Download list of materials" },
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

        <div>
          <h2>Downloads</h2>

          <div className="flex flex-col space-y-4 mt-4">
            {pipe(
              downloadLinks,
              A.mapWithIndex((i, { label, href }) => (
                <a href={href} key={href}>
                  <div className="flex font-semibold tracking-wide">
                    <span>{label}</span>
                    <span>
                      <ArrowDown
                        width="1em"
                        height="1em"
                        className="ml-2 translate-y-[15%]"
                      />
                    </span>
                  </div>
                </a>
              ))
            )}
          </div>
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
