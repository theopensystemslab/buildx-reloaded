import axios from "axios"
import FormData from "form-data"
import { File, IncomingForm } from "formidable"
import fs from "fs"
import { NextApiRequest, NextApiResponse } from "next"
import { Configuration, OpenAIApi } from "openai"

const primePrompt = (prompt: string) => `
Let me give some examples of correct responses and then try to give a correct JSON response to the final query.

Query: Stretch house by 5 meters from the front

Correct response:
{
  "command": "STRETCH",
  "side": "FRONT",
  "meters": 5,
}

Query: Stretch the house from the back by 6 metres

Correct response:
{
  "command": "STRETCH",
  "side": "BACK",
  "meters": 6,
}

Query: Subtract 4 meters from the back of the house

Correct response:
{
  "command": "STRETCH",
  "side": "BACK",
  "meters": -4,
}

Query: Make the house 10 meters shorter from the front

Correct response:
{
  "command": "STRETCH",
  "side": "FRONT",
  "meters": -10,
}

Query: Add 3 meters to the front

Correct response:
{
  "command": "STRETCH",
  "side": "FRONT",
  "meters": 3,
}

Query: Take away 2 meters from the back

Correct response:
{
  "command": "STRETCH",
  "side": "BACK",
  "meters": -2,
}

Query: Add a level to the house, above the first level

Correct response:
{
  "command": "ADD_LEVEL",
  "aboveIndex": 0
}

Query: Remove the second level

Correct response:
{
  "command": "REMOVE_LEVEL",
  "index": 1
}

Query: Move the house north by 5 meters

Correct response:
{
  "command": "MOVE",
  "x": 0,
  "z": 5
}

Query: Move the house west 3 meters

Correct response:
{
  "command": "MOVE",
  "x": -3,
  "z": 0
}

Query: Move the house south-east 9 meters

Correct response:
{
  "command": "MOVE",
  "x": 6.36,
  "z": -6.36
}

Query: Move the house north-west by 10 meters

Correct response:
{
  "command": "MOVE",
  "x": -7.07,
  "z": 7.07
}

Query: Rotate the house 45 degrees anti-clockwise

Correct reponse:
{
  "command": "ADD_ROTATION",
  "degrees": -45
}

Query: Rotate the house 60 degrees clockwise

Correct reponse:
{
  "command": "ADD_ROTATION",
  "degrees": 60
}

Query: Reset the house rotation to zero

Correct reponse:
{
  "command": "SET_ROTATION",
  "degrees": 0
}

Query: Set the house rotation to 90 degrees

Correct reponse:
{
  "command": "SET_ROTATION",
  "degrees": 90
}

Query: ${prompt}

Please respond only with the JSON, please do NOT prefix with "Correct response:" and please do not add any suffix, I must be able to parse the response as JSON.
`

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

    const gptResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: primePrompt(audioResponse.data.text) },
      ],
    })

    res
      .status(200)
      .json({ prompt: audioResponse.data, completion: gptResponse.data })
  } catch (e: any) {
    console.log(e)
    res.status(500).send(e)
  }
}
