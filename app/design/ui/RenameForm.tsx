import { Fragment } from "react"
import { useForm } from "react-hook-form"

type Props = {
  currentName: string
  onNewName: (s: string) => void
}

const RenameForm = (props: Props) => {
  const { currentName, onNewName } = props
  const { register, handleSubmit } = useForm()
  const onSubmit = ({ newName }: any) => {
    onNewName(newName)
  }

  return (
    <Fragment>
      <hr className="divide-y-2" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="text"
          defaultValue={currentName}
          {...register("newName")}
          className="w-full py-2 px-3 font-bold focus:outline-none"
          autoFocus
        />
      </form>
    </Fragment>
  )
}

export default RenameForm
