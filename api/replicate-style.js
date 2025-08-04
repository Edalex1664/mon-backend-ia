// api/replicate-style.js
import Replicate from "replicate";

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { imageDataUrl, style } = req.body || {};
  if (!imageDataUrl || !style) {
    return res.status(400).json({ error: "Champs requis manquants : imageDataUrl et style" });
  }

  try {
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const version = "f1023890"; // version valide du modèle style-transfer :contentReference[oaicite:3]{index=3}

    const output = await replicate.run(`fofr/style-transfer:${version}`, {
      input: {
        image: imageDataUrl,
        style_image: style, // ou selon les paramètres du modèle si prompt attendu
      },
    });

    const url = Array.isArray(output) ? output[0] : output;
    if (!url) {
      return res.status(502).json({ error: "Le modèle n’a pas renvoyé d’image" });
    }

    return res.status(200).json({ output_url: url });
  } catch (err) {
    console.error("Erreur backend /replicate-style:", err);
    return res.status(500).json({ error: err?.message || "Erreur IA backend" });
  }
}
