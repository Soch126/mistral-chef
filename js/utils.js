/* eslint-env node */
// Fonctions pures, sans dépendance au DOM ni au localStorage, extraites de
// scripts.js pour pouvoir être testées directement avec `node --test`
// (voir tests/utils.test.js). Chargé avant js/scripts.js dans index.html en
// script classique (pas de module bundler) : ces fonctions deviennent des
// globales partagées, comme le reste du code de l'app. Le `module` référencé
// plus bas n'existe qu'en Node (tests) ; le garde `typeof module !== ...`
// le rend inoffensif dans le navigateur.

function buildPrompt(ingredients, vibe, servings, diets = [], lang = "fr") {
  if (lang === "en") {
    const dietConstraintEn = diets.length > 0
      ? `\n\nCritical dietary constraint: the recipe must respect ${diets.join(", ")}. Do not use any ingredient that would violate it.`
      : "";

    return `You are a great chef. From the following ingredients: "${ingredients}", and with a "${vibe}" vibe, create a complete, original recipe for ${servings} serving(s). Adjust ingredient quantities to the number of servings.${dietConstraintEn}

Reply ONLY with a valid JSON object (no markdown, no backticks) in this format:
{
  "title": "Recipe name",
  "prep_time": "prep time",
  "cook_time": "cook time",
  "difficulty": "Easy / Medium / Hard",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
  "steps": ["detailed step 1", "detailed step 2"],
  "tip": "a chef's tip to nail this dish"
}

Be creative, precise, and inspiring. The recipe must be realistic and delicious. Respond in English.`;
  }

  const dietConstraint = diets.length > 0
    ? `\n\nContrainte alimentaire impérative : la recette doit respecter ${diets.join(", ")}. N'utilise aucun ingrédient qui l'enfreindrait.`
    : "";

  return `Tu es un grand chef cuisinier. À partir des ingrédients suivants : "${ingredients}", et avec une ambiance "${vibe}", crée une recette complète et originale pour ${servings} personne(s). Adapte les quantités des ingrédients au nombre de personnes.${dietConstraint}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks) au format suivant :
{
  "title": "Nom de la recette",
  "prep_time": "temps de préparation",
  "cook_time": "temps de cuisson",
  "difficulty": "Facile / Intermédiaire / Difficile",
  "ingredients": ["ingrédient 1 avec quantité", "ingrédient 2 avec quantité"],
  "steps": ["étape 1 détaillée", "étape 2 détaillée"],
  "tip": "une astuce de chef pour réussir ce plat"
}

Sois créatif, précis et inspirant. La recette doit être réaliste et délicieuse.`;
}

function recipeToText(recipe) {
  const lines = [
    recipe.title,
    "",
    `Préparation : ${recipe.prep_time}`,
    `Cuisson : ${recipe.cook_time}`,
    `Difficulté : ${recipe.difficulty}`,
    "",
    "Ingrédients :",
    ...recipe.ingredients.map((ing) => `- ${ing}`),
    "",
    "Instructions :",
    ...recipe.steps.map((step, i) => `${i + 1}. ${step}`),
    "",
    `Astuce du chef : ${recipe.tip}`,
  ];
  return lines.join("\n");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildPrompt, recipeToText };
}
