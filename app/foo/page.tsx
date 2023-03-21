"use client"
import { trpc } from "../../src/utils/trpc-2"
import DataInit from "../data/DataInit"

const FooPage = () => {
  const { data, error } = trpc.foo.useQuery()
  return (
    <div>
      {data ? (
        <div>
          <h1>Data!</h1>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      ) : error ? (
        <div>
          <h1>Error!</h1>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      ) : null}
      <DataInit />
    </div>
  )
}

export default FooPage
