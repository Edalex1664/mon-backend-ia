// /api/replicate-style.js
export const config = {
  api: {
    bodyParser: false,
  },
}

import Replicate from "replicate"
import formidable from "formidable"
import fs from "fs"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const form = new formidable.IncomingForm()

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Erreur de parsing" })
    }

    const style = fields.style
    const imageFile = files.image?.[0]

    if (!style || !imageFile) {
      return res.status(400).json({ error: "Image ou style manquant" })
    }

    try {
      const imageData = fs.readFileSync(imageFile.filepath)
      const base64Image = `data:${imageFile.mimetype};base64,${imageData.toString("base64")}`

      const output = await replicate.run("fofr/style-transfer", {
        input: {
          image: base64Image,
          prompt: `Apply ${style} style`,
        },
      })

      return res.status(200).json({ output_url: output[0] })
    } catch (err) {
      console.error("Erreur IA:", err)
      return res.status(500).json({ error: "Erreur IA (backend)" })
    }
  })
}
