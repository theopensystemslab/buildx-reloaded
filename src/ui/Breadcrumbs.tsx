import houses from "@/hooks/houses"
import siteContext, {
  enterBuildingMode,
  exitBuildingMode,
  SiteCtxModeEnum,
  useProjectName,
  useSiteCtxMode,
} from "@/hooks/siteCtx"
import { useRoute } from "@/utils/wouter"
import { Fragment, useState } from "react"
import Breadcrumb from "./Breadcrumb"
import RenameForm from "./RenameForm"

type Params = {
  buildingId: string
  levelIndex?: string
}

const BreadcrumbsWithParams = (params: Params) => {
  const { buildingId, levelIndex } = params

  const { friendlyName } = houses[buildingId]

  const [renamingBuilding, setRenamingBuilding] = useState(false)

  const mode = useSiteCtxMode()

  return (
    <Fragment>
      <span>{`/`}</span>
      <Breadcrumb
        path={`/site?buildingId=${buildingId}`}
        label={friendlyName}
        onClick={() => {
          switch (mode) {
            case SiteCtxModeEnum.Enum.BUILDING:
              setRenamingBuilding(true)
              break
            case SiteCtxModeEnum.Enum.LEVEL:
              enterBuildingMode(buildingId)
              break
          }
        }}
      />
      {renamingBuilding && (
        <RenameForm
          currentName={friendlyName}
          onNewName={(newName) => {
            if (newName.length > 0) houses[buildingId].friendlyName = newName
            setRenamingBuilding(false)
          }}
        />
      )}
      {typeof levelIndex !== "undefined" && (
        <Fragment>
          <span>{`/`}</span>
          <Breadcrumb
            path={`/site?buildingId=${buildingId}&levelIndex=${levelIndex}`}
            label={`Level ${levelIndex}`}
          />
        </Fragment>
      )}
    </Fragment>
  )
}

const Breadcrumbs = () => {
  const [, params] = useRoute<{ buildingId: string; levelIndex?: string }>(
    "/site:rest*"
  )

  const mode = useSiteCtxMode()

  const projectName = useProjectName()

  const [renamingProject, setRenamingProject] = useState(false)

  return (
    <div className="absolute top-0 left-0 m-1 z-20">
      <Breadcrumb
        path={`/site`}
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
        "buildingId" in params && (
          <BreadcrumbsWithParams {...(params as Params)} />
        )}
    </div>
  )
}

export default Breadcrumbs