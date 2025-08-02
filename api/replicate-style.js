import Replicate from "replicate";

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

export default async function handler(req, res) {
  // Ajout des entêtes CORS pour autoriser Framer
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { image, style } = req.body;
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  try {
    const output = await replicate.run("fofr/style-transfer", {
      input: { image, prompt: `Apply ${style} style` }
    });
    return res.status(200).json({ output_url: output[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur IA (backend)" });
  }
}
