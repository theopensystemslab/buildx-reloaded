export const GET_EXPORT_MODEL_EVENT = "GetExportModel"

export type UpdateWorkerGroupEventDetail = {
  houseId: string
  payload: any
}

export type GetModelEventDetail = {
  houseId: string
  format: "OBJ" | "GLB"
}

export type GetModelEvent = {
  type: typeof GET_EXPORT_MODEL_EVENT
  detail: GetModelEventDetail
}

export const dispatchGetModelEvent = ({
  houseId,
  format,
}: GetModelEventDetail) => {
  dispatchEvent(
    new CustomEvent(GET_EXPORT_MODEL_EVENT, { detail: { houseId, format } })
  )
}
