const LANG_KEY = "mistral_chef_lang";

const TRANSLATIONS = {
  fr: {
    badge: "✨ Propulsé par Mistral AI",
    subtitle: 'Donnez-nous des ingrédients, recevez une recette digne d\'un grand chef. <span class="accent" data-i18n="subtitleAccent">Gratuit, instantané, surprenant.</span>',
    apiKeyLabel: "🔑 Clé API Mistral",
    apiKeyPlaceholder: "ta clé API Mistral...",
    apiKeyHint: 'Disponible sur <a href="https://console.mistral.ai" target="_blank" rel="noopener" style="color: var(--gold);">console.mistral.ai</a> &mdash; elle reste sur ton navigateur.',
    apiKeySubmit: "Valider la clé",
    ingredientsLabel: "Tes ingrédients",
    ingredientsPlaceholder: "ex: poulet, citron, riz, oignons, épices...",
    dropHint: "Dépose une photo ici",
    ingredientsHint: "Sépare les ingrédients par des virgules, ou prends une photo.",
    vibeLabel: "L'ambiance",
    vibeClassic: "Classique",
    vibeHealthy: "Healthy",
    vibeExotic: "Exotique",
    vibeQuick: "Rapide",
    generateBtn: "Générer la recette",
    recipeBadge: "✨ Création Mistral",
    ingredientsTitle: "📝 Ingrédients",
    stepsTitle: "👨‍🍳 Instructions",
    tipTitle: "💡 Astuce du chef",
    newRecipeBtn: "← Nouvelle recette",
    footer: 'Mistral Chef &mdash; un projet pour le <a href="https://mistral.ai" target="_blank" rel="noopener">hackathon Mistral AI</a>',
    prepLabel: "⏱️ Préparation",
    cookLabel: "🔥 Cuisson",
    difficultyLabel: "📊 Difficulté",
  },
  en: {
    badge: "✨ Powered by Mistral AI",
    subtitle: 'Give us your ingredients, get a recipe worthy of a great chef. <span class="accent" data-i18n="subtitleAccent">Free, instant, surprising.</span>',
    apiKeyLabel: "🔑 Mistral API Key",
    apiKeyPlaceholder: "your Mistral API key...",
    apiKeyHint: 'Available at <a href="https://console.mistral.ai" target="_blank" rel="noopener" style="color: var(--gold);">console.mistral.ai</a> &mdash; it stays in your browser.',
    apiKeySubmit: "Validate key",
    ingredientsLabel: "Your ingredients",
    ingredientsPlaceholder: "e.g. chicken, lemon, rice, onions, spices...",
    dropHint: "Drop a photo here",
    ingredientsHint: "Separate ingredients with commas, or take a photo.",
    vibeLabel: "The vibe",
    vibeClassic: "Classic",
    vibeHealthy: "Healthy",
    vibeExotic: "Exotic",
    vibeQuick: "Quick",
    generateBtn: "Generate recipe",
    recipeBadge: "✨ Mistral Creation",
    ingredientsTitle: "📝 Ingredients",
    stepsTitle: "👨‍🍳 Instructions",
    tipTitle: "💡 Chef's tip",
    newRecipeBtn: "← New recipe",
    footer: 'Mistral Chef &mdash; a project for the <a href="https://mistral.ai" target="_blank" rel="noopener">Mistral AI hackathon</a>',
    prepLabel: "⏱️ Prep",
    cookLabel: "🔥 Cook",
    difficultyLabel: "📊 Difficulty",
  },
};

function getLang() {
  return localStorage.getItem(LANG_KEY) || "fr";
}

function applyTranslations(lang) {
  const dict = TRANSLATIONS[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!dict[key]) return;
    el.innerHTML = dict[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.placeholder = dict[key];
  });
}

const langSelect = document.getElementById("lang-select");
langSelect.value = getLang();
applyTranslations(getLang());

langSelect.addEventListener("change", () => {
  localStorage.setItem(LANG_KEY, langSelect.value);
  applyTranslations(langSelect.value);
});

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

const apiKeyInput = document.getElementById("api-key-input");
const apiKeySection = document.getElementById("api-key-section");
const apiKeyForm = document.getElementById("api-key-form");
const apiKeySubmit = document.getElementById("api-key-submit");
const apiKeyError = document.getElementById("api-key-error");

const form = document.getElementById("recipe-form");
const submitBtn = document.getElementById("submit-btn");
const recipeSection = document.getElementById("recipe-section");
const recipeCard = document.getElementById("recipe-card");
const recipeTitle = document.getElementById("recipe-title");
const recipeMeta = document.getElementById("recipe-meta");
const metaPrep = document.getElementById("meta-prep");
const metaCook = document.getElementById("meta-cook");
const metaDifficulty = document.getElementById("meta-difficulty");
const ingredientsList = document.getElementById("recipe-ingredients-list");
const stepsList = document.getElementById("recipe-steps-list");
const recipeTip = document.getElementById("recipe-tip");
const newRecipeBtn = document.getElementById("new-recipe-btn");
const vibeInput = document.getElementById("vibe");
const vibeBtns = document.querySelectorAll(".vibe-btn");

vibeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    vibeBtns.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    vibeInput.value = btn.dataset.vibe;
  });
});

vibeBtns[0].classList.add("is-active");

function getApiKey() {
  return localStorage.getItem("mistral_chef_api_key") || "";
}

function setApiKey(key) {
  localStorage.setItem("mistral_chef_api_key", key.trim());
}

function toggleApiKeySection() {
  const key = getApiKey();
  if (key) {
    apiKeySection.style.display = "none";
    form.style.display = "grid";
  } else {
    apiKeySection.style.display = "block";
    form.style.display = "none";
  }
}

apiKeyForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const key = apiKeyInput.value.trim();
  if (!key || key.length < 10) {
    apiKeyError.textContent = "❌ Clé API invalide. Vérifie sur console.mistral.ai";
    apiKeyError.style.display = "block";
    return;
  }
  apiKeyError.style.display = "none";
  setApiKey(key);
  toggleApiKeySection();
});

toggleApiKeySection();

newRecipeBtn.addEventListener("click", () => {
  recipeSection.classList.remove("is-visible");
  recipeSection.setAttribute("aria-hidden", "true");
  form.scrollIntoView({ behavior: "smooth" });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const ingredients = document.getElementById("ingredients").value.trim();
  const vibe = vibeInput.value;

  if (!ingredients) return;

  submitBtn.classList.add("is-loading");
  submitBtn.disabled = true;

  try {
    const prompt = buildPrompt(ingredients, vibe);
    const recipe = await callMistral(prompt);
    displayRecipe(recipe);
  } catch (err) {
    recipeCard.innerHTML = `<p class="error-message">❌ Erreur : ${err.message || "Impossible de générer la recette. Réessaie."}</p>`;
    recipeSection.classList.add("is-visible");
    recipeSection.setAttribute("aria-hidden", "false");
  } finally {
    submitBtn.classList.remove("is-loading");
    submitBtn.disabled = false;
  }
});

function buildPrompt(ingredients, vibe) {
  if (getLang() === "en") {
    return `You are a great chef. From the following ingredients: "${ingredients}", and with a "${vibe}" vibe, create a complete, original recipe.

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

  return `Tu es un grand chef cuisinier. À partir des ingrédients suivants : "${ingredients}", et avec une ambiance "${vibe}", crée une recette complète et originale.

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

async function callMistral(prompt) {
  const key = getApiKey();
  if (!key) {
    toggleApiKeySection();
    throw new Error("Clé API manquante");
  }

  const response = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content: "Tu es un chef cuisinier expert. Tu réponds uniquement en JSON valide, sans markdown.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

function displayRecipe(recipe) {
  const dict = TRANSLATIONS[getLang()];
  recipeTitle.textContent = recipe.title;
  metaPrep.textContent = `${dict.prepLabel} : ${recipe.prep_time}`;
  metaCook.textContent = `${dict.cookLabel} : ${recipe.cook_time}`;
  metaDifficulty.textContent = `${dict.difficultyLabel} : ${recipe.difficulty}`;

  ingredientsList.innerHTML = recipe.ingredients
    .map((ing) => `<li>${ing}</li>`)
    .join("");

  stepsList.innerHTML = recipe.steps
    .map((step) => `<li>${step}</li>`)
    .join("");

  recipeTip.textContent = recipe.tip;

  recipeSection.classList.add("is-visible");
  recipeSection.setAttribute("aria-hidden", "false");
  recipeSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Photo / Camera
const photoBtn = document.getElementById("photo-btn");
const photoInput = document.getElementById("photo-input");
const photoPreview = document.getElementById("photo-preview");
const photoPreviewImg = document.getElementById("photo-preview-img");
const photoPreviewClear = document.getElementById("photo-preview-clear");

photoBtn.addEventListener("click", () => {
  photoInput.value = "";
  photoInput.click();
});

photoPreviewClear.addEventListener("click", () => {
  photoPreview.classList.remove("is-visible");
  photoPreviewImg.src = "";
});

photoInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const ingredientsInput = document.getElementById("ingredients");

  photoBtn.classList.add("is-loading");
  photoBtn.disabled = true;

  try {
    const base64 = await fileToBase64(file);
    showPhotoPreview(base64);
    const result = await identifyIngredientsFromImage(base64);
    ingredientsInput.value = result.ingredients.join(", ");
    ingredientsInput.focus();
  } catch (err) {
    photoPreview.classList.remove("is-visible");
    const msg = document.getElementById("photo-error");
    msg.textContent = "📷 " + (err.message || "Impossible d'analyser la photo.");
    msg.style.display = "block";
    setTimeout(() => { msg.style.display = "none"; }, 4000);
  } finally {
    photoBtn.classList.remove("is-loading");
    photoBtn.disabled = false;
  }
});

function showPhotoPreview(base64) {
  photoPreviewImg.src = base64;
  photoPreview.classList.add("is-visible");
}

const dropZone = document.querySelector(".input-wrapper");
let dragCounter = 0;

dropZone.addEventListener("dragenter", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter++;
  dropZone.classList.add("is-dragover");
});

dropZone.addEventListener("dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter--;
  if (dragCounter === 0) dropZone.classList.remove("is-dragover");
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter = 0;
  dropZone.classList.remove("is-dragover");
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith("image/")) {
    photoInput.files = files;
    photoInput.dispatchEvent(new Event("change"));
  }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Lecture de l'image échouée"));
    reader.readAsDataURL(file);
  });
}

async function identifyIngredientsFromImage(base64Image) {
  const key = getApiKey();
  if (!key) throw new Error("Clé API manquante — configure ta clé d'abord.");

  const response = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Tu es un expert en identification d'ingrédients alimentaires. Identifie tous les ingrédients alimentaires visibles sur cette photo. Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks) au format : { \"ingredients\": [\"ingrédient 1\", \"ingrédient 2\", \"ingrédient 3\"] }",
            },
            {
              type: "image_url",
              image_url: base64Image,
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erreur API (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  throw new Error("Réponse invalide de l'API");
}
