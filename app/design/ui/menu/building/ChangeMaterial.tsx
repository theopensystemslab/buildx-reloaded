import { WatsonHealthSubVolume } from "@carbon/icons-react"
import { pipe } from "fp-ts/lib/function"
import { Eq } from "fp-ts/lib/string"
import { suspend } from "suspend-react"
import { Material } from "../../../../../server/data/materials"
import systemsDB from "../../../../db/systems"
import Radio from "../../../../ui/Radio"
import { A, EQ, O, Ord, R, S, someOrError } from "../../../../utils/functions"
import { ThreeMaterial } from "../../../../utils/three"
import { ScopeElement } from "../../../state/scope"
import { getActiveHouseUserData } from "../../../ui-3d/fresh/helpers/sceneQueries"
import { HouseTransformsGroup } from "../../../ui-3d/fresh/scene/userData"
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
  threeMaterial: ThreeMaterial
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

    // selected

    // alts

    // all = selected + alts (sorted by?)

    return { element, options: allOpts, selected: initialOpt }
  }, [])

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
        }))}
        selected={
          selected
          // house.modifiedMaterials?.[element.name] ?? element.defaultMaterial
        }
        onChange={(newMaterial) => {
          // houses[houseId].modifiedMaterials = {
          //   ...(house.modifiedMaterials ?? {}),
          //   [element.name]: newMaterial,
          // }
          // onComplete?.()
        }}
        onHoverChange={(hoveredMaterial) => {
          // if (
          //   hoveredMaterial &&
          //   !(hoveredMaterial in previews[houseId].materials)
          // ) {
          //   previews[houseId].materials[element.name] = hoveredMaterial
          // } else if (
          //   hoveredMaterial === null &&
          //   Object.keys(previews[houseId].materials).length !== 0
          // ) {
          //   previews[houseId].materials = {}
          // }
        }}
      />
    </ContextMenuNested>
  )
}

export default ChangeMaterial
