export const UPDATE_EXPORT_MODELS_EVENT = "UpdateExportModels"
export const GET_EXPORT_MODEL_EVENT = "GetExportModel"

export type UpdateWorkerGroupEventDetail = {
  houseId: string
  payload: any
}

export type UpdateWorkerGroupEvent = {
  type: typeof UPDATE_EXPORT_MODELS_EVENT
  detail: UpdateWorkerGroupEventDetail
}

export type GetModelEventDetail = {
  houseId: string
  format: "OBJ" | "GLB"
}

export type GetModelEvent = {
  type: typeof GET_EXPORT_MODEL_EVENT
  detail: GetModelEventDetail
}

export const dispatchUpdateExportModelsEvent = ({
  houseId,
  payload,
}: UpdateWorkerGroupEventDetail) => {
  dispatchEvent(
    new CustomEvent(UPDATE_EXPORT_MODELS_EVENT, {
      detail: { houseId, payload },
    })
  )
}

export const dispatchGetModelEvent = ({
  houseId,
  format,
}: GetModelEventDetail) => {
  dispatchEvent(
    new CustomEvent(GET_EXPORT_MODEL_EVENT, { detail: { houseId, format } })
  )
}
