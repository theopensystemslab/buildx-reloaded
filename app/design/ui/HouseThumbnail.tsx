import type { HouseType } from "@/server/data/houseTypes"
import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { nanoid } from "nanoid"
import { Suspense, memo, useEffect, useMemo, useState } from "react"
import { suspend } from "suspend-react"
import { Group } from "three"
import { useGetFriendlyName, useHouses } from "../../db/user"
import { A, O } from "../../utils/functions"
import { setRaycasting } from "../../utils/three"
import { setSidebar } from "../state/settings"
import { useScene } from "../ui-3d/fresh/FreshApp"
import { findFirstGuardDown } from "../ui-3d/fresh/helpers/sceneQueries"
import { createHouseTransformsGroup } from "../ui-3d/fresh/scene/houseTransformsGroup"
import {
  HouseTransformsGroup,
  isHouseTransformsGroup,
} from "../ui-3d/fresh/scene/userData"
import clsx from "clsx"

type Props = {
  houseType: HouseType
}

const HouseThumbnailButton = memo(({ houseType }: Props) => {
  const scene = useScene()

  const maybeWorldGroup = useMemo(
    () =>
      pipe(
        scene,
        O.fromNullable,
        O.chain((scene) =>
          pipe(
            scene,
            findFirstGuardDown((x): x is Group => {
              return x.name === "WORLD"
            })
          )
        )
      ),
    [scene]
  )

  const getFriendlyName = useGetFriendlyName()

  const houses = useHouses()

  const [maybeHouseTransformsGroup, setHouseTransformsGroup] = useState<
    O.Option<HouseTransformsGroup>
  >(O.none)

  useEffect(() => {
    if (!scene) return

    const { dnas, id: houseTypeId, systemId } = houseType

    createHouseTransformsGroup({
      friendlyName: "", // getFriendlyName(),
      activeElementMaterials: {},
      dnas,
      houseId: nanoid(),
      houseTypeId,
      systemId,
    })().then((houseTransformsGroup) => {
      setRaycasting(houseTransformsGroup, true)

      setHouseTransformsGroup(O.some(houseTransformsGroup))
    })
  }, [houseType, houses, scene])

  const addHouse = () => {
    if (!scene) return

    pipe(
      maybeHouseTransformsGroup,
      O.map((houseTransformsGroup) =>
        pipe(
          maybeWorldGroup,
          O.map((worldGroup) => {
            const collisionsCheck = () =>
              pipe(
                maybeWorldGroup,
                O.match(
                  () => false,
                  (worldGroup) => {
                    const nearNeighbours =
                      houseTransformsGroup.userData.computeNearNeighbours(
                        worldGroup
                      )

                    return houseTransformsGroup.userData.checkCollisions(
                      nearNeighbours
                    )
                  }
                )
              )

            const MAX_T = 99
            let t = 0 // parameter for the spiral
            let a = 1 // tightness of the spiral, might need adjustment

            do {
              // Calculate the new position on the spiral
              const x = a * t * Math.cos(t)
              const z = a * t * Math.sin(t)

              // Move the houseTransformsGroup to new position
              houseTransformsGroup.position.set(x, 0, z)

              houseTransformsGroup.userData
                .getActiveLayoutGroup()
                .userData.updateBBs()
              t += 1 // Increment t by an amount to ensure the loop can exit
            } while (t < MAX_T && collisionsCheck())

            if (t >= MAX_T) throw new Error(`Infinite collision!`)

            houseTransformsGroup.userData.setVerticalCuts()

            worldGroup.add(houseTransformsGroup)

            houseTransformsGroup.userData
              .getActiveLayoutGroup()
              .userData.updateBBs()

            houseTransformsGroup.userData.friendlyName = getFriendlyName()
            houseTransformsGroup.userData.addToDB()

            // clear handles
            pipe(worldGroup.children, A.filter(isHouseTransformsGroup)).forEach(
              (x) => x.userData.switchHandlesVisibility()
            )

            setSidebar(false)

            invalidate()
          })
        )
      )
    )
  }

  const illuminate = O.isSome(maybeHouseTransformsGroup)

  return (
    <button
      onClick={addHouse}
      className={clsx(
        "rounded px-3 py-1 text-sm text-white transition-colors duration-200 ease-in-out hover:bg-black",
        {
          ["bg-grey-80"]: illuminate,
          ["bg-grey-30"]: !illuminate,
        }
      )}
    >
      Add to site
    </button>
  )
})

const HouseThumbnail = ({ houseType }: Props) => {
  return (
    <div className="flex items-center space-x-2 border-b border-grey-20 px-4 py-4">
      <div
        className="h-20 w-20 flex-none rounded-full bg-grey-20"
        style={{
          backgroundImage: `url(${houseType.imageUrl})`,
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
        <HouseThumbnailButton houseType={houseType} />
      </div>
    </div>
  )
}

export default memo(HouseThumbnail)
