// api/replicate-style.js

import Replicate from "replicate";

export const config = {
  api: {
    bodyParser: false, // Important : désactiver le bodyParser pour gérer FormData manuellement
  },
};

export default async function handler(req, res) {
  // CORS headers pour Framer
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Récupérer les champs multipart avec formidable
  const formidable = await import("formidable");
  const form = formidable.default({ maxFileSize: 10 * 1024 * 1024 }); // 10MB

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Erreur parsing:", err);
      return res.status(500).json({ error: "Erreur lors de l'upload" });
    }

    const imageFile = files.image?.[0];
    const style = fields.style?.[0];

    if (!imageFile || !style) {
      return res.status(400).json({ error: "Image ou style manquant" });
    }

    const fs = await import("fs/promises");
    const base64 = await fs.readFile(imageFile.filepath, { encoding: "base64" });
    const imageData = `data:${imageFile.mimetype};base64,${base64}`;

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    try {
      const output = await replicate.run("fofr/style-transfer", {
        input: { image: imageData, prompt: `Apply ${style} style` },
      });
      return res.status(200).json({ output_url: output[0] });
    } catch (e) {
      console.error("Erreur replicate:", e);
      return res.status(500).json({ error: "Erreur IA (backend)" });
    }
  });
}
