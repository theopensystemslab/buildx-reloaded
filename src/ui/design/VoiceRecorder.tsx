import { useCallback, useEffect } from "react"
import { useReactMediaRecorder } from "react-media-recorder"
import { useKeyPressEvent } from "react-use"
import * as z from "zod"
import houses from "../../hooks/houses"
import scope from "../../hooks/scope"
import {
  setStretchLength,
  stretchLengthClamped,
} from "../../hooks/transients/stretchLength"
import { degreesToRadians, sign } from "../../utils/math"

const VoiceRecorder = () => {
  const { startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder(
    {
      blobPropertyBag: {
        type: "audio/webm",
      },
    }
  )

  const fetchBlob = async (url: string) => {
    const r0 = await fetch(url)
    const blob = await r0.blob()
    return blob
  }

  const go = useCallback(async (blobUrl: string) => {
    if (scope.selected === null) return

    const houseId = scope.selected.houseId

    const audioBlob = await fetchBlob(blobUrl)

    const formData = new FormData()
    formData.append("file", audioBlob, "audio.webm")

    const response = await fetch("/api/audio", {
      method: "POST",
      body: formData,
    })

    if (response.ok) {
      try {
        const jsonResponse = await response.json()

        const parsed = z
          .object({
            completion: z.object({
              choices: z.array(
                z.object({
                  message: z.object({
                    content: z.string(),
                  }),
                })
              ),
            }),
            prompt: z.object({
              text: z.string(),
            }),
          })
          .safeParse(jsonResponse)

        if (parsed.success) {
          const {
            completion: {
              choices: [
                {
                  message: { content },
                },
              ],
            },
            prompt: { text: prompt },
          } = parsed.data

          console.log({ prompt, completion: content })

          const payload = JSON.parse(content.trim())

          switch (payload.command) {
            case "ADD_ROTATION":
              console.log(payload.command)
              houses[houseId].rotation += degreesToRadians(payload.degrees)
              break
            case "SET_ROTATION":
              houses[houseId].rotation = degreesToRadians(payload.degrees)
              break
            case "STRETCH":
              const direction: 1 | -1 = payload.side === "FRONT" ? -1 : 1
              const distance = direction * payload.meters
              const foo = {
                direction,
                distance,
                dx: 0,
                dz: 0,
              }
              console.log(foo)
              stretchLengthClamped[houseId] = foo
              setStretchLength()
              break
            case "ADD_LEVEL":
              break
          }
        }
      } catch (e) {
        console.log(e)
      }
    } else {
      console.error("Error:", response.status, response.statusText)
    }
  }, [])

  useKeyPressEvent("r", startRecording, stopRecording)

  useEffect(() => {
    if (mediaBlobUrl) go(mediaBlobUrl)
  }, [go, mediaBlobUrl])

  return null
}

export default VoiceRecorder
