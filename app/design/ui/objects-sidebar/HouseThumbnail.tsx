import type { CachedHouseType } from "@opensystemslab/buildx-core"
import { memo } from "react"
import HouseThumbnailButton from "./HouseThumbnailButton"

type Props = {
  houseType: CachedHouseType
  close: () => void
}

const HouseThumbnail = ({ houseType, close }: Props) => {
  return (
    <div className="flex items-center space-x-2 border-b border-grey-20 px-4 py-4">
      <div
        className="h-20 w-20 flex-none rounded-full bg-grey-20"
        style={{
          backgroundImage: houseType.imageBlob
            ? `url(${URL.createObjectURL(houseType.imageBlob)})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "50% 50%",
        }}
      ></div>
      <div className="space-y-0.5">
        <h3 className="text-xl font-bold">{houseType.name}</h3>
        <p className="text-sm">{houseType.description}</p>
        <div className="space-x-2">
          {[].map((tag, tagIndex) => (
            <span key={tagIndex} className="rounded-xl bg-grey-10 px-3 py-0.5">
              {tag}
            </span>
          ))}
        </div>
        <HouseThumbnailButton houseType={houseType} close={close} />
      </div>
    </div>
  )
}

export default memo(HouseThumbnail)
