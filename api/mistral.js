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

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });
  } catch (err) {
    res.status(502).json({ error: "Erreur en contactant l'API Mistral." });
    return;
  }

  res.status(upstreamResponse.status);
  const contentType = upstreamResponse.headers.get("content-type");
  if (contentType) res.setHeader("Content-Type", contentType);

  if (!upstreamResponse.body) {
    res.end();
    return;
  }

  // Relaie le flux tel quel (SSE en streaming ou JSON classique) au lieu de
  // bufferiser toute la réponse : le front (js/scripts.js -> callMistral)
  // envoie toujours stream: true et lit la réponse au fil de l'eau pour
  // afficher la recette en direct pendant sa génération. Bufferiser ici
  // cassait cet effet en mode proxy : rien ne s'affichait avant la toute
  // fin de la génération.
  const reader = upstreamResponse.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  } finally {
    res.end();
  }
};
