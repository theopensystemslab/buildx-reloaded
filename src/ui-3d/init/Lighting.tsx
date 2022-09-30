import { softShadows } from "@react-three/drei"

softShadows()

const shadowProps = {
  "shadow-mapSize-width": 1024,
  "shadow-mapSize-height": 1024,
  "shadow-camera-far": 50,
  "shadow-camera-left": -10,
  "shadow-camera-right": 10,
  "shadow-camera-top": 10,
  "shadow-camera-bottom": -10,
}

interface LightSetting {
  position: [number, number, number]
  color: string
  intensity: number
  castShadow?: boolean
}

const intensityScale = 0.76

const VISUALIZE_LIGHTS = false

const Lighting = () => {
  const eveningLights: Array<LightSetting> = [
    {
      position: [0, 20, -20],
      color: "#fffcdb",
      intensity: 0.8 * intensityScale,
      castShadow: true,
    },

    {
      position: [0, 20, 20],
      color: "#b5d7fc",
      intensity: 0.8 * intensityScale,
    },

    {
      position: [-20, 20, 0],
      color: "#fff",
      intensity: 0.3 * intensityScale,
    },

    {
      position: [20, 20, 0],
      color: "#9bb9c6",
      intensity: 0.3 * intensityScale,
    },
  ]
  return (
    <>
      <ambientLight intensity={0.5 * intensityScale} />
      {eveningLights.map((light, index) => (
        <directionalLight key={index} {...light} {...shadowProps} />
      ))}
    </>
  )
}

export default Lighting
