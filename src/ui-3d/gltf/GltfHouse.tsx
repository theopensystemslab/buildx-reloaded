import { useColumnLayout } from "@/hooks/layouts"
import { Fragment, useRef } from "react"
import { Group } from "three"
import { useDimensionsSubscription } from "../../hooks/dimensions"
import { useHouseModuleElementGeometries } from "../../hooks/geometries"
import {
  useHouseEventHandlers,
  useMoveRotateSubscription,
} from "../../hooks/houses"
import {
  EditModeEnum,
  SiteCtxModeEnum,
  useEditMode,
  useSiteCtx,
  useSiteCtxMode,
} from "../../hooks/siteCtx"
import RotateHandles from "../RotateHandles"
import VerticalHandle from "../VerticalHandle"
import GltfColumn from "./GltfColumn"

type Props = {
  id: string
}

const GltfHouse = (props: Props) => {
  const groupRef = useRef<Group>(null!)
  const { id } = props
  const columns = useColumnLayout(id)

  useDimensionsSubscription(id, columns)
  useMoveRotateSubscription(id, groupRef)

  const bind = useHouseEventHandlers(id)

  useHouseModuleElementGeometries(id)

  // continue here
  // useHouseElementGeometries(id, columns)

  const editMode = useEditMode()
  const siteCtxMode = useSiteCtxMode()

  // if you're just at site level
  //   only need to render the whole house external

  // if you're in building mode
  //   render external the same but you do need columns
  //     and stretchability

  // if you're in level mode
  //   that's when you need internal etc

  // remember you want to be able to stretch from level mode

  switch (siteCtxMode) {
    case SiteCtxModeEnum.Enum.SITE:
      return (
        <Fragment>
          <group ref={groupRef}>
            <group {...bind()}>
              {columns.map(({ columnIndex, z, gridGroups }) => {
                return (
                  <GltfColumn
                    key={columnIndex}
                    houseId={id}
                    columnIndex={columnIndex}
                    columnZ={z}
                    gridGroups={gridGroups}
                    verticalCutPlanes={[]}
                    mirror={columnIndex === columns.length - 1}
                  />
                )
              })}
            </group>
            {editMode === EditModeEnum.Enum.MOVE_ROTATE && (
              <RotateHandles houseId={id} houseLength={0} houseWidth={0} />
            )}
          </group>
          {editMode === EditModeEnum.Enum.MOVE_ROTATE && (
            <VerticalHandle houseId={id} />
          )}
        </Fragment>
      )
    case SiteCtxModeEnum.Enum.BUILDING:
    case SiteCtxModeEnum.Enum.LEVEL:
      return (
        <Fragment>
          <Fragment />
        </Fragment>
      )
  }
}

export default GltfHouse
