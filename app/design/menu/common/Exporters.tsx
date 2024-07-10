// @ts-nocheck
import { ArrowDown } from "@carbon/icons-react"
import { identity, pipe } from "fp-ts/lib/function"
import { useHouse } from "../../../../db/user"
import { A, O } from "../../../../utils/functions"
import { useHousesModelRows } from "../../../../workers/exporters/hook"
import { ContextMenuBlobButton } from "./ContextMenuBlobButton"
import ContextMenuNested from "./ContextMenuNested"

const Exporters = ({
  houseId,
  close,
}: {
  houseId: string
  close: () => void
}) => {
  const house = useHouse(houseId)

  const { friendlyName, glbData, objData } = pipe(
    useHousesModelRows([houseId]),
    A.head,
    O.chain(({ glbData, objData }) =>
      pipe(
        house,
        O.chain(({ friendlyName }) =>
          O.some({
            friendlyName,
            glbData,
            objData,
          })
        )
      )
    ),
    O.match(() => ({ friendlyName: "", glbData: "", objData: "" }), identity)
  )

  return (
    <ContextMenuNested icon={<ArrowDown size={20} />} label={`Export`}>
      <ContextMenuBlobButton
        icon={<ArrowDown size={20} />}
        text="OBJ"
        href={URL.createObjectURL(new Blob([objData], { type: "text/plain" }))}
        download={`${friendlyName}.obj`}
        onClick={close}
      />
      <ContextMenuBlobButton
        icon={<ArrowDown size={20} />}
        text="GLB"
        href={URL.createObjectURL(
          new Blob([glbData], { type: "model/gltf-binary" })
        )}
        download={`${friendlyName}.glb`}
        onClick={close}
      />
    </ContextMenuNested>
  )
}

export default Exporters
