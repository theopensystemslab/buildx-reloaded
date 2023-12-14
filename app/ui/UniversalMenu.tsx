import Sidebar from "~/ui//Sidebar"
// import map from "@/src/hooks/map"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import usePortal from "react-cool-portal"
import Loader from "./Loader"
import Modal from "./Modal"
import userDB, { useHouses } from "../db/user"
import exportsDB from "~/db/exports"
import { PromiseExtended } from "dexie"
import { trashMapPolygon } from "~/locate/state/polygon"

type Props = {
  open: boolean
  close: () => void
}

const UniversalMenu = ({ open, close }: Props) => {
  const router = useRouter()

  const pathname = usePathname()

  const [deleteProject, setDeleteProject] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const reallyDelete = async () => {
    setDeleting(true)

    const dbs = [userDB, exportsDB]

    // Create an array to hold all the promises
    const clearTablePromises: PromiseExtended<void>[] = []

    dbs.forEach((database) => {
      database.tables.forEach((table) => {
        // Assume `clear()` returns a promise. Push each promise to the array.
        clearTablePromises.push(table.clear())
      })
    })

    trashMapPolygon()

    // Wait for all the clear table promises to resolve
    await Promise.all(clearTablePromises)

    if (pathname === "/locate") {
      window.location.reload()
    } else {
      router.push("/locate")
    }
  }

  const { Portal } = usePortal()

  return (
    <Sidebar expanded={open} onClose={close}>
      <div className="p-4">
        <button onClick={() => setDeleteProject(true)}>Delete Project</button>
      </div>
      {deleting ? (
        <Portal>
          <div className="absolute z-50 flex h-full w-full items-center justify-center bg-white">
            <Loader />
          </div>
        </Portal>
      ) : deleteProject ? (
        <Modal onClose={() => setDeleteProject(false)} title="Delete Project?">
          <p>You will not be able to undo this</p>

          <div className="flex items-center justify-end space-x-4">
            <button onClick={() => setDeleteProject(false)}>Cancel</button>
            <button
              className="bg-grey-80 px-4 py-1 text-white hover:bg-black"
              onClick={reallyDelete}
            >
              Delete
            </button>
          </div>
        </Modal>
      ) : null}
    </Sidebar>
  )
}

export default UniversalMenu
