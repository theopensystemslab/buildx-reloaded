import ContextMenuHeading from "../ContextMenuHeading"
import ContextMenuNested from "../ContextMenuNested"
import { findFirst } from "fp-ts/lib/Array"
import { pipe } from "fp-ts/lib/function"
import { toNullable } from "fp-ts/lib/Option"
import React from "react"
import { useSystemElements } from "~/data/elements"
import { useSystemMaterials } from "~/data/materials"
import houses, { useHouse } from "~/design/state/houses"
import { O } from "~/utils/functions"
import { WatsonHealthSubVolume } from "@carbon/icons-react"
import Radio from "~/ui//Radio"
import previews from "~/design/state/previews"

const ChangeMaterials = ({
  houseId,
  elementName,
  onComplete,
}: {
  houseId: string
  elementName: string
  onComplete?: () => void
}) => {
  // const systemId = houses[houseId].systemId

  // const elements = useSystemElements({ systemId })
  // const materials = useSystemMaterials({ systemId })

  // const house = useHouse(houseId)

  // needs a re-write

  return null

  // return pipe(
  //   elements,
  //   findFirst(
  //     (element) =>
  //       element.systemId === house.systemId && element.name === elementName
  //   ),
  //   O.map((element) => {
  //     const thumbnailsByMaterial = element
  //       ? (() => {
  //           const record: Record<string, string> = {}
  //           materials.forEach((material) => {
  //             if (
  //               material.systemId === house.systemId &&
  //               element.materialOptions.includes(material.specification)
  //             ) {
  //               record[material.specification] = material.imageUrl
  //             }
  //           })
  //           return record
  //         })()
  //       : {}

  //     const options = element.materialOptions.map((option) => ({
  //       label: option,
  //       value: option,
  //       thumbnail: thumbnailsByMaterial[option],
  //     }))

  //     return options.length < 1 ? null : (
  //       <ContextMenuNested
  //         icon={<WatsonHealthSubVolume size={20} />}
  //         label={`Change material`}
  //       >
  //         <ContextMenuHeading>{elementName}</ContextMenuHeading>
  //         <Radio
  //           options={options}
  //           selected={
  //             house.modifiedMaterials?.[element.name] ?? element.defaultMaterial
  //           }
  //           onChange={(newMaterial) => {
  //             houses[houseId].modifiedMaterials = {
  //               ...(house.modifiedMaterials ?? {}),
  //               [element.name]: newMaterial,
  //             }
  //             onComplete?.()
  //           }}
  //           onHoverChange={(hoveredMaterial) => {
  //             if (
  //               hoveredMaterial &&
  //               !(hoveredMaterial in previews[houseId].materials)
  //             ) {
  //               previews[houseId].materials[element.name] = hoveredMaterial
  //             } else if (
  //               hoveredMaterial === null &&
  //               Object.keys(previews[houseId].materials).length !== 0
  //             ) {
  //               previews[houseId].materials = {}
  //             }
  //           }}
  //         />
  //       </ContextMenuNested>
  //     )
  //   }),
  //   toNullable
  // )
}

export default ChangeMaterials
