import Replicate from "replicate";

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } }
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { image, style } = req.body;
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const output = await replicate.run("fofr/style-transfer", {
    input: { image, prompt: `Apply ${style} style` }
  });
  res.status(200).json({ output_url: output[0] });
}
