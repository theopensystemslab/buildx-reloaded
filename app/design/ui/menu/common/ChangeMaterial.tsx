import { WatsonHealthSubVolume } from "@carbon/icons-react"
import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { Fragment, Suspense, useRef } from "react"
import { suspend } from "suspend-react"
import { MeshStandardMaterial } from "three"
import { Material } from "../../../../../server/data/materials"
import systemsDB from "../../../../db/systems"
import Radio from "../../../../ui/Radio"
import { A, EQ, O, Ord, R, S } from "../../../../utils/functions"
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
}

const ChangeMaterialOptions = (props: Props) => {
  const {
    houseTransformsGroup,
    scopeElement: { ifcTag },
    close,
  } = props

  const { systemId, activeElementMaterials } =
    getActiveHouseUserData(houseTransformsGroup)

  const { element, options, selected } = suspend(async () => {
    const element = await systemsDB.elements.get({ systemId, ifcTag })

    if (!element) throw new Error("wtf")

    const initialOpt: MaterialOpt = pipe(
      // if we've changed the material
      activeElementMaterials,
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
  }, [ifcTag])

  const thisIfcTagMeshes = pipe(
    houseTransformsGroup,
    findAllGuardDown(
      (x): x is ElementMesh => isElementMesh(x) && x.userData.ifcTag === ifcTag
    )
  )

  const closing = useRef(false)

  return (
    <Fragment>
      <ContextMenuHeading>{element?.name}</ContextMenuHeading>
      <Radio
        options={options.map((x) => ({
          label: x.material.specification,
          value: x,
          thumbnail: x.material.imageUrl,
        }))}
        selected={selected}
        onChange={(newMaterial) => {
          houseTransformsGroup.userData.changeMaterial(
            ifcTag,
            newMaterial.material.specification
          )

          // thisIfcTagMeshes.forEach((x) => {

          //   x.material = newMaterial.threeMaterial
          // })

          closing.current = true

          // houseTransformsGroup.userData.activeElementMaterials = {
          //   ...activeElementMaterials,
          //   [ifcTag]: newMaterial.material.specification,
          // }

          houseTransformsGroup.userData.dbSync()

          close()

          invalidate()
        }}
        onHoverChange={(hoveredMaterial) => {
          if (closing.current) return

          if (hoveredMaterial) {
            // thisIfcTagMeshes.forEach((x) => {
            //   x.material = hoveredMaterial.threeMaterial
            // })

            houseTransformsGroup.userData.changeMaterial(
              ifcTag,
              hoveredMaterial.material.specification
            )
          } else {
            // thisIfcTagMeshes.forEach((x) => {
            //   x.material = selected.threeMaterial
            // })
            houseTransformsGroup.userData.changeMaterial(
              ifcTag,
              selected.material.specification
            )
          }
          invalidate()
        }}
      />
    </Fragment>
  )
}

const ChangeMaterial = (props: Props) => {
  return (
    <ContextMenuNested
      long
      label={`Change material`}
      icon={<WatsonHealthSubVolume size={20} />}
    >
      <Suspense fallback={null}>
        <ChangeMaterialOptions {...props} />
      </Suspense>
    </ContextMenuNested>
  )
}
export default ChangeMaterial
