// /api/replicate-style.js
import Replicate from "replicate";

export const config = {
  api: { bodyParser: { sizeLimit: "15mb" } },
};

export default async function handler(req, res) {
  // CORS pour Framer
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { imageDataUrl, style } = req.body || {};
    if (!imageDataUrl || !style) {
      return res
        .status(400)
        .json({ error: "Champs requis manquants: imageDataUrl et style" });
    }
    if (!/^data:image\/(png|jpe?g);base64,/.test(imageDataUrl)) {
      return res
        .status(400)
        .json({ error: "imageDataUrl doit être un Data URL base64 (png/jpg)" });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Modèle : instruct-pix2pix (édition d'image guidée par prompt)
    const prompt = `apply a ${style} style, t-shirt graphic, high quality, clean edges`;
    const input = {
      image: imageDataUrl,          // ✅ on passe directement le Data URL
      prompt,
      num_inference_steps: 40,
      guidance_scale: 7,
      image_guidance_scale: 1.6,
    };

    const output = await replicate.run("timbrooks/instruct-pix2pix", { input });

    // La sortie est généralement un tableau d'URLs d'images
    const outputUrl =
      Array.isArray(output) && output.length ? output[0] : null;

    if (!outputUrl) {
      return res.status(502).json({ error: "Aucune image retournée par l'IA" });
    }

    return res.status(200).json({ output_url: outputUrl });
  } catch (err) {
    console.error("Erreur backend /replicate-style:", err);
    return res.status(500).json({ error: "Erreur IA (backend)" });
  }
}
