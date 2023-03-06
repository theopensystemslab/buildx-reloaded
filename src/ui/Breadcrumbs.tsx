import houses from "@/hooks/houses"
import siteContext, {
  enterBuildingMode,
  exitBuildingMode,
  SiteCtxModeEnum,
  useProjectName,
  useSiteCtx,
} from "@/hooks/siteCtx"
import { useRoute } from "@/utils/wouter"
import { Fragment, useState } from "react"
import Breadcrumb from "./Breadcrumb"
import RenameForm from "./RenameForm"

type Params = {
  houseId: string
  levelIndex?: string
}

const BreadcrumbsWithParams = (params: Params) => {
  const { houseId, levelIndex } = params

  const { friendlyName } = houses[houseId]

  const [renamingBuilding, setRenamingBuilding] = useState(false)

  const { mode } = useSiteCtx()

  return (
    <Fragment>
      <span>{`/`}</span>
      <Breadcrumb
        path={`/design?houseId=${houseId}`}
        label={friendlyName}
        onClick={() => {
          switch (mode) {
            case SiteCtxModeEnum.Enum.BUILDING:
              setRenamingBuilding(true)
              break
            case SiteCtxModeEnum.Enum.LEVEL:
              enterBuildingMode(houseId)
              break
          }
        }}
      />
      {renamingBuilding && (
        <RenameForm
          currentName={friendlyName}
          onNewName={(newName) => {
            if (newName.length > 0) houses[houseId].friendlyName = newName
            setRenamingBuilding(false)
          }}
        />
      )}
      {typeof levelIndex !== "undefined" && (
        <Fragment>
          <span>{`/`}</span>
          <Breadcrumb
            path={`/design?houseId=${houseId}&levelIndex=${levelIndex}`}
            label={`Level ${levelIndex}`}
          />
        </Fragment>
      )}
    </Fragment>
  )
}

const Breadcrumbs = () => {
  const [, params] = useRoute<{ houseId: string; levelIndex?: string }>(
    "/design:rest*"
  )

  const { mode } = useSiteCtx()

  const projectName = useProjectName()

  const [renamingProject, setRenamingProject] = useState(false)

  return (
    <Fragment>
      <Breadcrumb
        path={`/design`}
        label={
          projectName === null || projectName.length === 0
            ? `New Project`
            : projectName
        }
        onClick={() => {
          if (mode !== SiteCtxModeEnum.Enum.SITE) exitBuildingMode()
          else if (!renamingProject) setRenamingProject(true)
        }}
      />
      {renamingProject && (
        <RenameForm
          currentName={projectName}
          onNewName={(newName) => {
            if (newName.length > 0) siteContext.projectName = newName
            setRenamingProject(false)
          }}
        />
      )}
      {mode !== SiteCtxModeEnum.Enum.SITE &&
        typeof params !== "boolean" &&
        params !== null &&
        "houseId" in params && (
          <BreadcrumbsWithParams {...(params as Params)} />
        )}
    </Fragment>
  )
}

export default Breadcrumbs
