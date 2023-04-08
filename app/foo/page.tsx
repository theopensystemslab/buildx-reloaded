"use client"
import AppInit from "@/ui-3d/init/AppInit"
import DataInit from "../data/DataInit"
import Main from "./Main"

const FooPage = () => {
  return (
    <DataInit>
      <AppInit>
        <Main />
      </AppInit>
    </DataInit>
  )
}

export default FooPage
