// @ts-nocheck
import { WatsonHealthSubVolume } from "@carbon/icons-react"
import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, useRef } from "react"
import Radio from "../../../../ui/Radio"
import { A, S } from "../../../../utils/functions"
import { ScopeElement } from "../../../state/scope"
import { getActiveHouseUserData } from "../../../ui-3d/fresh/helpers/sceneQueries"
import { HouseTransformsGroup } from "../../../ui-3d/fresh/scene/userData"
import ContextMenuHeading from "../common/ContextMenuHeading"
import ContextMenuNested from "../common/ContextMenuNested"

type Props = {
  scopeElement: ScopeElement
  houseTransformsGroup: HouseTransformsGroup
  close: () => void
}

const ChangeMaterial = (props: Props) => {
  const {
    houseTransformsGroup,
    scopeElement: { ifcTag },
    close,
  } = props

  const { activeElementMaterials, elements, materials } =
    getActiveHouseUserData(houseTransformsGroup)

  const element = elements[ifcTag]

  const selectedMaterial = materials[activeElementMaterials[ifcTag]].material

  const allMaterials = pipe(
    [element.defaultMaterial, ...element.materialOptions],
    A.uniq(S.Eq),
    A.map((x) => materials[x].material)
  )

  const closing = useRef(false)

  return element.materialOptions.length > 1 ? (
    <ContextMenuNested
      long
      label={`Change material`}
      icon={<WatsonHealthSubVolume size={20} />}
    >
      {/* <ChangeMaterialOptions {...props} /> */}

      <ContextMenuHeading>{element?.name}</ContextMenuHeading>
      <Radio
        options={allMaterials.map((material) => ({
          label: material.specification,
          value: material,
          thumbnail: material.imageUrl,
        }))}
        selected={selectedMaterial}
        onChange={(newMaterial) => {
          closing.current = true

          houseTransformsGroup.userData.changeMaterial(
            ifcTag,
            newMaterial.specification
          )

          houseTransformsGroup.userData.updateDB()

          close()
        }}
        onHoverChange={(hoveredMaterial) => {
          if (closing.current) return

          if (hoveredMaterial) {
            houseTransformsGroup.userData.changeMaterial(
              ifcTag,
              hoveredMaterial.specification
            )
          } else {
            houseTransformsGroup.userData.changeMaterial(
              ifcTag,
              selectedMaterial.specification
            )
          }
          invalidate()
        }}
      />
    </ContextMenuNested>
  ) : null
}

export default ChangeMaterial
