import Replicate from "replicate";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { imageDataUrl, style } = req.body;
  if (!imageDataUrl || !style) {
    return res.status(400).json({ error: "Champs requis manquants: imageDataUrl et style" });
  }

  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run("fofr/style-transfer", {
      input: {
        image: imageDataUrl,
        prompt: `Apply ${style} style`,
      },
    });

    return res.status(200).json({ outputUrl: output[0] });
  } catch (err) {
    console.error("Erreur backend /replicate-style:", err);
    return res.status(500).json({ error: "Erreur serveur : " + err.message });
  }
}
