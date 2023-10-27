import { pipe } from "fp-ts/lib/function"
import { Fragment, useState } from "react"
import { useRoute } from "~/utils/wouter"
import userDB, { House, housesToRecord, useHouses } from "../../db/user"
import { O, R } from "../../utils/functions"
import siteContext, {
  SiteCtxModeEnum,
  dispatchModeChange,
  useProjectName,
  useSiteCtx,
} from "../state/siteCtx"
import Breadcrumb from "./Breadcrumb"
import RenameForm from "./RenameForm"

type Props = {
  houses: House[]
  params: {
    houseId?: string
    levelIndex?: string
  }
}

const BreadcrumbsWithParams = (props: Props) => {
  const { params, houses } = props
  const { houseId, levelIndex } = params

  const [renamingBuilding, setRenamingBuilding] = useState(false)

  const { mode } = useSiteCtx()

  return pipe(
    houseId,
    O.fromNullable,
    O.chain((houseId) =>
      pipe(
        houses,
        housesToRecord,
        R.lookup(houseId),
        O.map((house): JSX.Element => {
          const { friendlyName } = house

          return (
            <Fragment key={friendlyName}>
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
                      dispatchModeChange({
                        prev: mode,
                        next: SiteCtxModeEnum.Enum.BUILDING,
                      })
                      break
                  }
                }}
              />
              {renamingBuilding && (
                <RenameForm
                  currentName={friendlyName}
                  onNewName={(newName) => {
                    if (newName.length > 0) {
                      userDB.houses.update(houseId, {
                        friendlyName,
                      })
                    }
                    setRenamingBuilding(false)
                  }}
                />
              )}
              {pipe(
                levelIndex,
                O.fromNullable,
                O.match(
                  () => null,
                  (levelIndex) => (
                    <Fragment>
                      <span>{`/`}</span>
                      <Breadcrumb
                        path={`/design?houseId=${houseId}&levelIndex=${levelIndex}`}
                        label={`Level ${levelIndex}`}
                      />
                    </Fragment>
                  )
                )
              )}
            </Fragment>
          )
        })
      )
    ),
    O.getOrElse(() => <></>)
  )
}

const Breadcrumbs = () => {
  const [, params] = useRoute<{ houseId: string; levelIndex?: string }>(
    "/design:rest*"
  )

  const houses = useHouses()

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
          if (mode !== SiteCtxModeEnum.Enum.SITE) {
            dispatchModeChange({ prev: mode, next: SiteCtxModeEnum.Enum.SITE })
          } else if (!renamingProject) {
            setRenamingProject(true)
          }
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
          <BreadcrumbsWithParams {...{ params, houses }} />
        )}
    </Fragment>
  )
}

export default Breadcrumbs
