import { WatsonHealthSubVolume } from "@carbon/icons-react"
import { invalidate } from "@react-three/fiber"
import { flow, pipe } from "fp-ts/lib/function"
import { useRef } from "react"
import { suspend } from "suspend-react"
import { MeshStandardMaterial } from "three"
import { Material } from "../../../../../server/data/materials"
import systemsDB from "../../../../db/systems"
import userDB from "../../../../db/user"
import Radio from "../../../../ui/Radio"
import { A, EQ, O, Ord, R, S } from "../../../../utils/functions"
import { ThreeMaterial } from "../../../../utils/three"
import { ScopeElement } from "../../../state/scope"
import {
  findAllGuardDown,
  getActiveHouseUserData,
} from "../../../ui-3d/fresh/helpers/sceneQueries"
import {
  ElementMesh,
  HouseTransformsGroup,
  isElementMesh,
} from "../../../ui-3d/fresh/scene/userData"
import { getSystemMaterial } from "../../../ui-3d/fresh/systems"
import ContextMenuHeading from "../common/ContextMenuHeading"
import ContextMenuNested from "../common/ContextMenuNested"

type Props = {
  scopeElement: ScopeElement
  houseTransformsGroup: HouseTransformsGroup
  close: () => void
}

type MaterialOpt = {
  material: Material
  threeMaterial: MeshStandardMaterial
}

const ChangeMaterial = (props: Props) => {
  const {
    houseTransformsGroup,
    scopeElement: { dna, houseId, gridGroupIndex, object, ifcTag },
    close,
  } = props

  const { systemId, modifiedMaterials } =
    getActiveHouseUserData(houseTransformsGroup)

  const { element, options, selected } = suspend(async () => {
    const element = await systemsDB.elements.get({ systemId, ifcTag })

    if (!element) throw new Error("wtf")

    const initialOpt: MaterialOpt = pipe(
      // if we've changed the material
      modifiedMaterials,
      R.lookup(element.name),
      // this material data
      O.map((specification) => getSystemMaterial({ systemId, specification })),
      // otherwise default element material
      O.getOrElse(() =>
        getSystemMaterial({ systemId, specification: element.defaultMaterial })
      )
    )

    const altOpts: MaterialOpt[] = pipe(
      element.materialOptions,
      A.map((specification) => getSystemMaterial({ systemId, specification }))
    )

    const allOpts: MaterialOpt[] = pipe(
      [initialOpt, ...altOpts],
      A.uniq(
        pipe(
          S.Eq,
          EQ.contramap((x: MaterialOpt) => x.material.specification)
        )
      ),
      A.sort(
        pipe(
          S.Ord,
          Ord.contramap((x: MaterialOpt) => x.material.specification)
        )
      )
    )

    return { element, options: allOpts, selected: initialOpt }
  }, [])

  const thisIfcTagMeshes = pipe(
    houseTransformsGroup,
    findAllGuardDown(
      (x): x is ElementMesh => isElementMesh(x) && x.userData.ifcTag === ifcTag
    )
  )

  const closing = useRef(false)

  return (
    <ContextMenuNested
      icon={<WatsonHealthSubVolume size={20} />}
      label={`Change material`}
    >
      <ContextMenuHeading>{element?.name}</ContextMenuHeading>
      <Radio
        options={options.map((x) => ({
          label: x.material.specification,
          value: x,
          thumbnail: x.material.imageUrl,
        }))}
        selected={selected}
        onChange={(newMaterial) => {
          thisIfcTagMeshes.forEach((x) => {
            x.material = newMaterial.threeMaterial
          })

          closing.current = true

          userDB.houses.update(houseId, {
            modifiedMaterials: {
              ...modifiedMaterials,
              [ifcTag]: newMaterial.material.specification,
            },
          })

          close()

          invalidate()
        }}
        onHoverChange={(hoveredMaterial) => {
          if (closing.current) return

          if (hoveredMaterial) {
            thisIfcTagMeshes.forEach((x) => {
              x.material = hoveredMaterial.threeMaterial
            })
          } else {
            thisIfcTagMeshes.forEach((x) => {
              x.material = selected.threeMaterial
            })
          }
          invalidate()
        }}
      />
    </ContextMenuNested>
  )
}

export default ChangeMaterial
