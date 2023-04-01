import { IncomingForm } from "formidable"
import { NextApiResponse } from "next"
import { NextApiRequest } from "next"
import FormData from "form-data"
import fs from "fs"
import { File } from "formidable"
import axios from "axios"

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const form = new IncomingForm()
  const formData = await new Promise((res, rej) => {
    const formData = new FormData()

    form.parse(req, (err, fields, files) => {
      if (err) rej(err)

      formData.append("model", "whisper-1")

      for (const key in fields) {
        formData.append(key, fields[key])
      }

      const go = (key: string, file: File) => {
        formData.append(
          key,
          fs.createReadStream(file.filepath),
          file.originalFilename ?? file.newFilename
        )
      }

      for (const key in files) {
        const file = files[key]
        if (Array.isArray(file)) {
          for (const singleFile of file) {
            go(key, singleFile)
          }
        } else {
          go(key, file)
        }
      }

      res(formData)
    })
  })

  const axiosResponse = await axios.post(
    "https://api.openai.com/v1/audio/transcriptions",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  )

  res.status(200).json(axiosResponse.data)
}
