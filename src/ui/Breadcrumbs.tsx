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
import usePortal from "react-cool-portal"
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
        path={`/design?buildingId=${buildingId}`}
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
            path={`/design?buildingId=${buildingId}&levelIndex=${levelIndex}`}
            label={`Level ${levelIndex}`}
          />
        </Fragment>
      )}
    </Fragment>
  )
}

const Breadcrumbs = () => {
  const [, params] = useRoute<{ buildingId: string; levelIndex?: string }>(
    "/design:rest*"
  )

  const mode = useSiteCtxMode()

  const projectName = useProjectName()

  const [renamingProject, setRenamingProject] = useState(false)

  const { Portal } = usePortal({
    containerId: "headerStart",
    autoRemoveContainer: false,
    internalShowHide: false,
  })

  return (
    <Portal>
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
        "buildingId" in params && (
          <BreadcrumbsWithParams {...(params as Params)} />
        )}
    </Portal>
  )
}

export default Breadcrumbs
