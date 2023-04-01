import { useCallback, useEffect } from "react"
import { useReactMediaRecorder } from "react-media-recorder"
import { useKeyPressEvent } from "react-use"

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
    const audioBlob = await fetchBlob(blobUrl)

    const formData = new FormData()
    formData.append("file", audioBlob, "audio.webm")

    const response = await fetch("/api/audio", {
      method: "POST",
      body: formData,
    })

    if (response.ok) {
      const jsonResponse = await response.json()
      console.log(jsonResponse)
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
