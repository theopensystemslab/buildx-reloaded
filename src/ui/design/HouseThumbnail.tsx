import type { HouseType } from "@/data/houseType"

type Props = {
  houseType: HouseType
  onAdd: () => void
}

const HouseThumbnail = (props: Props) => {
  const { houseType } = props

  return (
    <div className="flex items-center space-x-2 border-b border-gray-200 px-4 py-4">
      <div
        className="h-20 w-20 flex-none rounded-full bg-grey-20"
        style={{
          backgroundImage: `url(${props.houseType.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "50% 50%",
        }}
      ></div>
      <div className="space-y-0.5">
        <h3 className="text-xl font-bold">{props.houseType.name}</h3>
        <p className="text-sm">{props.houseType.description}</p>
        <div className="space-x-2">
          {[].map((tag, tagIndex) => (
            <span key={tagIndex} className="rounded-xl bg-grey-10 px-3 py-0.5">
              {tag}
            </span>
          ))}
        </div>
        <button
          onClick={props.onAdd}
          className="rounded bg-grey-80 px-3 py-1 text-sm text-white transition-colors duration-200 ease-in-out hover:bg-black"
        >
          Add to site
        </button>
      </div>
    </div>
  )
}

export default HouseThumbnail
