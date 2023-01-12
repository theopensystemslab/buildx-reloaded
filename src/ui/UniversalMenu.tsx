import Sidebar from "@/ui/Sidebar"
import houses from "@/hooks/houses"
// import map from "@/hooks/map"
import { useRouter } from "next/router"
import React, { useState } from "react"
import usePortal from "react-cool-portal"
import Loader from "./Loader"
import Modal from "./Modal"

type Props = {
  open: boolean
  close: () => void
}

const UniversalMenu = ({ open, close }: Props) => {
  const router = useRouter()

  const path = router.pathname.split("/")?.[1] ?? ""

  const [deleteProject, setDeleteProject] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const reallyDelete = () => {
    setDeleting(true)
    localStorage.clear()
    Object.keys(houses).forEach((k) => {
      delete houses[k]
    })
    // map.polygon = null
    // map.mode = "SEARCH"
    // if (path === "map") {
    router.reload()
    // } else {
    //   router.push("/map")
    // }
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
