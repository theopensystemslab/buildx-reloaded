import { useSystemModules } from "@/data/modules"
import { ColumnLayout } from "@/hooks/layouts"
import { GroupProps } from "@react-three/fiber"
import { pipe } from "fp-ts/lib/function"
import {
  forwardRef,
  Fragment,
  PropsWithChildren,
  useRef,
  useState,
} from "react"
import { Group } from "three"
import { useSnapshot } from "valtio"
import houses from "../../hooks/houses"
import previews from "../../hooks/previews"
import { O, R, S } from "../../utils/functions"
import { useSubscribeKey } from "../../utils/hooks"
import PhonyDnaHouse2 from "./stretchWidth/PhonyDnaHouse2"

const ShowHider = ({
  houseId,
  showDistance,
  children,
}: PropsWithChildren<{
  houseId: string
  showDistance: number
}>) => {
  const ref = useRef<Group>(null!)

  // useSubscribeKey(stretchWidthClamped, houseId, () => {
  //   if (!stretchWidthClamped[houseId]) return
  //   const { distance } = stretchWidthClamped[houseId]

  //   if (showDistance - distance < 0.0001) {
  //     ref.current.scale.set(1, 1, 1)
  //     invalidate()
  //     console.log("show")
  //   } else {
  //     ref.current.scale.set(0, 0, 0)
  //     invalidate()
  //     console.log("hide")
  //   }
  // })

  return (
    <group ref={ref} scale={[0, 0, 0]}>
      {children}
    </group>
  )
}

type Props = GroupProps & {
  houseId: string
  setHouseVisible: (b: boolean) => void
  // columnLayout: ColumnLayout
}

const OtherPhoneys = forwardRef<Group, Props>((props, ref) => {
  const {
    houseId,
    // columnLayout,
    setHouseVisible,
    ...groupProps
  } = props

  const systemId = houses[houseId].systemId

  const [children, setChildren] = useState<JSX.Element[]>([])

  useSubscribeKey(previews[houseId], "dna", () => {
    setChildren(
      pipe(
        previews[houseId].dna,
        R.collect(S.Ord)((k, { value }) => {
          return (
            <PhonyDnaHouse2
              key={k}
              houseId={houseId}
              systemId={systemId}
              dna={value}
              setHouseVisible={setHouseVisible}
            />
          )
        })
      )
    )
  })

  return <Fragment>{children}</Fragment>

  // return (
  //   <group
  //     ref={ref}
  //     scale={isStretchable && canStretchWidth ? [1, 1, 1] : [0, 0, 0]}
  //     {...groupProps}
  //   >
  //     <StretchHandle
  //       ref={leftHandleRef}
  //       houseId={houseId}
  //       axis="x"
  //       direction={1}
  //     />
  //     <StretchHandle
  //       ref={rightHandleRef}
  //       houseId={houseId}
  //       axis="x"
  //       direction={-1}
  //     />
  //     {pipe(
  //       dnaChangeOptions,
  //       R.filterWithIndex((k) => k !== current.code),
  //       R.toArray,
  //       A.map(([k, dna]) => {
  //         return (
  //           <StretchWidthShowHider
  //             key={k}
  //             houseId={houseId}
  //             showDistance={(sectionTypesByCode[k].width - houseWidth) / 2}
  //           >
  //             <PhonyDnaHouse systemId={systemId} houseId={houseId} dna={dna} />
  //           </StretchWidthShowHider>
  //         )
  //       })
  //     )}
  //   </group>
  // )
})

export default OtherPhoneys
