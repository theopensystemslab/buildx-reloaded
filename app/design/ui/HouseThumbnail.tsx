import type { HouseType } from "@/server/data/houseTypes"
import { invalidate } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import { nanoid } from "nanoid"
import { useMemo } from "react"
import { suspend } from "suspend-react"
import { Group } from "three"
import { useGetFriendlyName, useHouses } from "../../db/user"
import { O } from "../../utils/functions"
import { setSidebar } from "../state/settings"
import { useScene } from "../ui-3d/fresh/FreshApp"
import { findFirstGuardDown } from "../ui-3d/fresh/helpers/sceneQueries"
import { createHouseTransformsGroup } from "../ui-3d/fresh/scene/houseTransformsGroup"
import { HouseTransformsGroup } from "../ui-3d/fresh/scene/userData"
import { setRaycasting } from "../../utils/three"
import Image from "next/image"
import { getSystemsWorker } from "../../workers"
import siteCtx, { SiteCtxModeEnum } from "../state/siteCtx"

type Props = {
  houseType: HouseType
}

const HouseThumbnail = ({ houseType }: Props) => {
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

  const houses = useHouses()
  const getFriendlyName = useGetFriendlyName()

  const maybeHouseTransformsGroup: O.Option<HouseTransformsGroup> =
    suspend(async () => {
      if (!scene) return O.none

      const { dnas, id: houseTypeId, systemId } = houseType

      const houseTransformsGroup = await createHouseTransformsGroup({
        friendlyName: "", // getFriendlyName(),
        activeElementMaterials: {},
        position: { x: 0, y: 0, z: 0 },
        dnas,
        houseId: nanoid(),
        houseTypeId,
        rotation: 0,
        systemId,
      })()

      setRaycasting(houseTransformsGroup, true)

      const collisionsCheck = () =>
        pipe(
          maybeWorldGroup,
          O.match(
            () => false,
            (worldGroup) => {
              const nearNeighbours =
                houseTransformsGroup.userData.computeNearNeighbours(worldGroup)

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
          .unsafeGetActiveLayoutGroup()
          .userData.updateBBs()

        t += 1 // Increment t by an amount to ensure the loop can exit
      } while (t < MAX_T && collisionsCheck())

      if (t >= MAX_T) throw new Error(`Infinite collision!`)

      return O.some(houseTransformsGroup)
    }, [houseType, houses.length, scene])

  const addHouse = () => {
    if (!scene) return

    pipe(
      maybeHouseTransformsGroup,
      O.map((houseTransformsGroup) =>
        pipe(
          maybeWorldGroup,
          O.map((worldGroup) => {
            worldGroup.add(houseTransformsGroup)
            houseTransformsGroup.userData.friendlyName = getFriendlyName()
            houseTransformsGroup.userData.addToDB()

            setSidebar(false)
            invalidate()
          })
        )
      )
    )
  }

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
        <button
          onClick={addHouse}
          className="rounded bg-grey-80 px-3 py-1 text-sm text-white transition-colors duration-200 ease-in-out hover:bg-black"
        >
          Add to site
        </button>
      </div>
    </div>
  )
}

export default HouseThumbnail
