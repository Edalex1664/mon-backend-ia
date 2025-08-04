// /api/replicate-style.js
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // pour accepter un base64 d'image raisonnable
    },
  },
};

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // ou restreins à ton domaine Framer
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Import "replicate" en dynamique pour capturer l'erreur si le package n'est pas installé
  let Replicate;
  try {
    ({ default: Replicate } = await import("replicate"));
  } catch (e) {
    console.error("Import replicate failed:", e);
    return res.status(500).json({
      error: "Replicate SDK introuvable. Assure-toi que 'replicate' est en dependencies et redeploy.",
    });
  }

  try {
    const { imageDataUrl, style } = req.body || {};

    if (!imageDataUrl || !style) {
      return res
        .status(400)
        .json({ error: "Champs requis manquants: imageDataUrl et style" });
    }

    // Instancie le client Replicate
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // ⚠️ Beaucoup de modèles Replicate attendent une URL http(s), pas une data URL.
    // Le SDK récent expose un "files.upload" qui prend un Buffer ou un Blob et renvoie une URL temporaire.
    // On convertit la data URL en Buffer et on l’upload via le SDK, puis on passe l’URL au modèle.

    // Convert dataURL -> Buffer
    const matches = imageDataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: "imageDataUrl invalide" });
    }
    const base64 = matches[2];
    const buffer = Buffer.from(base64, "base64");

    // Upload fichier vers Replicate Files
    let fileUrl;
    try {
      // @ts-ignore (selon version SDK)
      const uploadResp = await replicate.files.upload(buffer, {
        filename: "upload.png",
        contentType: "image/png",
      });
      fileUrl = uploadResp?.url;
    } catch (e) {
      console.error("Upload vers Replicate Files a échoué:", e);
      return res.status(500).json({ error: "Upload image vers Replicate échoué" });
    }

    if (!fileUrl) {
      return res.status(500).json({ error: "URL de fichier manquante après upload" });
    }

    // Appel du modèle (remplace par le modèle que tu utilises vraiment)
    // Ex: "fofr/style-transfer" (vérifie la doc du modèle pour les clés d'input exactes)
    const output = await replicate.run("fofr/style-transfer", {
      input: {
        image: fileUrl,
        prompt: `Apply ${style} style`,
      },
    });

    // Certains modèles renvoient un tableau d’URLs, d’autres une unique URL
    const outputUrl = Array.isArray(output) ? output[0] : output;
    if (!outputUrl) {
      return res.status(500).json({ error: "Pas de résultat retourné par l'IA" });
    }

    return res.status(200).json({ output_url: outputUrl });
  } catch (err) {
    console.error("Erreur backend:", err);
    return res.status(500).json({ error: "Erreur IA (backend)" });
  }
}
