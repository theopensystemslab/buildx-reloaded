import { IncomingForm } from "formidable"
import { NextApiResponse } from "next"
import { NextApiRequest } from "next"
import FormData from "form-data"
import fs from "fs"
import { File } from "formidable"
import axios from "axios"
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai"

export const config = {
  api: {
    bodyParser: false,
  },
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
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

    const audioResponse = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    )

    // const gptResponse = await axios.post(
    //   "https://api.openai.com/v1/chat/completions",
    //   {

    //   }
    // )

    const messages: ChatCompletionRequestMessage[] = [
      {
        role: "system",
        content:
          "Act as a JSON interface for the user. Please respond with one of the JSON snippets as specified by the user.",
      },
      {
        role: "system",
        content: `
Our application can be passed commands in JSON that match the Command type definition as part of the following TypeScript schema:

type StretchCommand = {
  type: "STRETCH"
  axis?: "z" | "x"
  direction?: 1 | -1
  meters?: number
}

type LevelCommand = {
  type: "LEVEL"
  relative?: number
  action?: "ADD_ABOVE" | "REMOVE"
  number?: number
}

type TranslateCommand = {
  type: "TRANSLATE"
  x?: number
  z?: number
}

type Command = StretchCommand | LevelCommand | TranslateCommand
      `,
      },
      { role: "user", content: "stretch the house 5 meters from the back" },
      {
        role: "assistant",
        content: `
{
  "type": "STRETCH",
  "axis": "z",
  "direction": 1,
  "meters": 5
}
        `,
      },
      { role: "user", content: "Add a level above the 1st floor" },
      {
        role: "assistant",
        content: `
{
  "type": "LEVEL",
  "relative": 1,
  "action": "ADD_ABOVE"
  "number": 1
}
        `,
      },
      { role: "user", content: "Move the house 3 meters to the left" },
      {
        role: "assistant",
        content: `
{
  "type": "TRANSLATE",
  "x": -3
  "z": 0 
}
        `,
      },
      { role: "user", content: "Move the house 8 meters forwards" },
      {
        role: "assistant",
        content: `
{
  "type": "TRANSLATE",
  "x": 0
  "z": -8
}
        `,
      },
      { role: "user", content: "Add two levels" },
      {
        role: "assistant",
        content: `
{
  "type": "LEVEL",
  "relative": 0,
  "action": "ADD_ABOVE"
  "number": 2
}
        `,
      },
    ]

    const gptResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.1,
    })

    // const gptResponse = await axios.post(
    //   "https://api.openai.com/v1/chat/completions",
    //   gptPayload,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    //     },
    //   }
    // )

    res
      .status(200)
      .json({ prompt: audioResponse.data, completion: gptResponse.data })
  } catch (e: any) {
    console.log(e, { ERRORKEYS: Object.keys(e) })
    console.log(e.request.data.error)
    res.status(500).send(e)
    // res.status(e.response.status).json(e.response.data)
  }
}
