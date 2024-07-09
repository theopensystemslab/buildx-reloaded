import React from "react"

type Props = {
  foo: any
}

const Foo = (props: Props) => {
  const { foo } = props
  console.log({ foo })
  return <div className="whitespace-pre">{JSON.stringify(foo, null, 2)}</div>
}

export default Foo
