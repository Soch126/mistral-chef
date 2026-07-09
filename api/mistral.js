// Fonction serverless (compatible Vercel/Netlify) qui relaie les appels à l'API Mistral
// en utilisant une clé stockée côté serveur (MISTRAL_API_KEY), pour les déploiements
// où l'on ne veut pas demander à chaque utilisateur sa propre clé API.
//
// Déploiement (Vercel) :
//   1. Ajoute la variable d'environnement MISTRAL_API_KEY dans les settings du projet
//   2. Déploie ce dossier `api/` tel quel, Vercel le détecte automatiquement
//
// Ce proxy est optionnel : le site fonctionne toujours en mode "BYOK" (Bring Your Own Key)
// par défaut. Voir js/scripts.js -> CONFIG.useProxy pour l'activer côté front.

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "MISTRAL_API_KEY n'est pas configurée côté serveur." });
    return;
  }

  try {
    const upstreamResponse = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstreamResponse.text();
    res.status(upstreamResponse.status);
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  } catch (err) {
    res.status(502).json({ error: "Erreur en contactant l'API Mistral." });
  }
};
