/* global buildPrompt, recipeToText */
// buildPrompt et recipeToText vivent dans js/utils.js (chargé avant ce
// fichier dans index.html) pour rester testables sans DOM avec `node --test`.

const THEME_KEY = "mistral_chef_theme";
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "light" ? "☀️" : "🌙";
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  applyTheme(saved || (prefersLight ? "light" : "dark"));
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "light" ? "dark" : "light";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

initTheme();

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
    ingredientsHint: "Sépare les ingrédients par des virgules, ou prends une photo (bouton 📷 ou glisser-déposer une image).",
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
    ingredientsHint: "Separate ingredients with commas, or take a photo (📷 button or drag & drop an image).",
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
const HISTORY_KEY = "mistral_chef_history";
const HISTORY_MAX = 10;
const FAVORITES_KEY = "mistral_chef_favorites";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function addToHistory(recipe) {
  const history = getHistory();
  history.unshift({ ...recipe, savedAt: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_MAX)));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  if (history.length === 0) {
    historySection.style.display = "none";
    return;
  }
  historySection.style.display = "block";
  historyList.innerHTML = history
    .map((recipe, i) => `<li><button type="button" class="history-item" data-index="${i}">${escapeHtml(recipe.title)}</button></li>`)
    .join("");
}

function isFavorite(recipe) {
  return getFavorites().some((r) => r.title === recipe.title);
}

function toggleFavorite(recipe) {
  const favorites = getFavorites();
  const index = favorites.findIndex((r) => r.title === recipe.title);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.unshift(recipe);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  renderFavorites();
  return index < 0;
}

function renderFavorites() {
  const favorites = getFavorites();
  if (favorites.length === 0) {
    favoritesSection.style.display = "none";
    return;
  }
  favoritesSection.style.display = "block";
  favoritesList.innerHTML = favorites
    .map((recipe, i) => `<li><button type="button" class="favorite-item" data-index="${i}">⭐ ${escapeHtml(recipe.title)}</button></li>`)
    .join("");
}

// Si un déploiement fournit un proxy serverless (voir api/mistral.js), on l'utilise
// pour éviter de demander une clé API à chaque utilisateur. Sinon on reste en mode
// "Bring Your Own Key" (comportement par défaut, clé stockée dans le navigateur).
const CONFIG = {
  useProxy: Boolean(window.MISTRAL_CHEF_USE_PROXY),
  proxyUrl: "/api/mistral",
};

const LOADING_MESSAGES = [
  "Le chef réfléchit...",
  "Choix des épices...",
  "Recherche d'inspiration...",
  "Équilibrage des saveurs...",
  "Dressage de l'assiette...",
  "Dernières touches...",
];

const loadingMessageEl = document.getElementById("loading-message");
let loadingMessageInterval = null;

function startLoadingMessages() {
  let i = 0;
  loadingMessageEl.textContent = LOADING_MESSAGES[0];
  loadingMessageInterval = setInterval(() => {
    i = (i + 1) % LOADING_MESSAGES.length;
    loadingMessageEl.textContent = LOADING_MESSAGES[i];
  }, 2000);
}

function stopLoadingMessages() {
  clearInterval(loadingMessageInterval);
  loadingMessageEl.textContent = "";
}

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
const clearKeyBtn = document.getElementById("clear-key-btn");
const copyRecipeBtn = document.getElementById("copy-recipe-btn");
let currentRecipe = null;
const pdfBtn = document.getElementById("pdf-btn");
const historySection = document.getElementById("history");
const historyList = document.getElementById("history-list");
const favoriteBtn = document.getElementById("favorite-btn");
const favoritesSection = document.getElementById("favorites");
const favoritesList = document.getElementById("favorites-list");
const variantBtn = document.getElementById("variant-btn");
let lastParams = null;
const shareBtn = document.getElementById("share-btn");
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

const dietBtns = document.querySelectorAll(".diet-btn");
const selectedDiets = new Set();

dietBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const diet = btn.dataset.diet;
    if (selectedDiets.has(diet)) {
      selectedDiets.delete(diet);
      btn.classList.remove("is-active");
    } else {
      selectedDiets.add(diet);
      btn.classList.add("is-active");
    }
  });
});

function getApiKey() {
  return localStorage.getItem("mistral_chef_api_key") || "";
}

function setApiKey(key) {
  localStorage.setItem("mistral_chef_api_key", key.trim());
}

function clearApiKey() {
  localStorage.removeItem("mistral_chef_api_key");
  apiKeyInput.value = "";
}

function toggleApiKeySection() {
  if (CONFIG.useProxy) {
    apiKeySection.style.display = "none";
    form.style.display = "grid";
    return;
  }
  const key = getApiKey();
  if (key) {
    apiKeySection.style.display = "none";
    form.style.display = "grid";
  } else {
    apiKeySection.style.display = "block";
    form.style.display = "none";
  }
}

async function isApiKeyValid(key) {
  try {
    const response = await fetch("https://api.mistral.ai/v1/models", {
      headers: { "Authorization": `Bearer ${key}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

apiKeyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const key = apiKeyInput.value.trim();
  if (!key || key.length < 10) {
    apiKeyError.textContent = "❌ Clé API invalide. Vérifie sur console.mistral.ai";
    apiKeyError.style.display = "block";
    return;
  }

  apiKeyError.style.display = "none";
  apiKeySubmit.classList.add("is-loading");
  apiKeySubmit.disabled = true;

  const valid = await isApiKeyValid(key);

  apiKeySubmit.classList.remove("is-loading");
  apiKeySubmit.disabled = false;

  if (!valid) {
    apiKeyError.textContent = "❌ Cette clé a été refusée par l'API Mistral. Vérifie-la sur console.mistral.ai";
    apiKeyError.style.display = "block";
    return;
  }

  setApiKey(key);
  toggleApiKeySection();
});

toggleApiKeySection();
renderHistory();
renderFavorites();

historyList.addEventListener("click", (e) => {
  const btn = e.target.closest(".history-item");
  if (!btn) return;
  const history = getHistory();
  const recipe = history[Number(btn.dataset.index)];
  if (recipe) displayRecipe(recipe, { skipHistory: true });
});

favoritesList.addEventListener("click", (e) => {
  const btn = e.target.closest(".favorite-item");
  if (!btn) return;
  const favorites = getFavorites();
  const recipe = favorites[Number(btn.dataset.index)];
  if (recipe) displayRecipe(recipe, { skipHistory: true });
});

clearKeyBtn.addEventListener("click", () => {
  clearApiKey();
  toggleApiKeySection();
  apiKeyInput.focus();
});

copyRecipeBtn.addEventListener("click", async () => {
  if (!currentRecipe) return;
  try {
    await navigator.clipboard.writeText(recipeToText(currentRecipe));
    const original = copyRecipeBtn.textContent;
    copyRecipeBtn.textContent = "✅ Copié !";
    setTimeout(() => { copyRecipeBtn.textContent = original; }, 2000);
  } catch {
    copyRecipeBtn.textContent = "❌ Échec de la copie";
  }
});

pdfBtn.addEventListener("click", () => {
  window.print();
});

favoriteBtn.addEventListener("click", () => {
  if (!currentRecipe) return;
  toggleFavorite(currentRecipe);
  updateFavoriteBtn(currentRecipe);
});

shareBtn.addEventListener("click", async () => {
  if (!currentRecipe) return;
  const text = recipeToText(currentRecipe);

  if (navigator.share) {
    try {
      await navigator.share({ title: currentRecipe.title, text });
    } catch {
      // Annulé par l'utilisateur, rien à faire
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    const original = shareBtn.textContent;
    shareBtn.textContent = "✅ Copié dans le presse-papier";
    setTimeout(() => { shareBtn.textContent = original; }, 2000);
  } catch {
    shareBtn.textContent = "❌ Échec du partage";
  }
});

newRecipeBtn.addEventListener("click", () => {
  recipeSection.classList.remove("is-visible");
  recipeSection.setAttribute("aria-hidden", "true");
  form.scrollIntoView({ behavior: "smooth" });
  document.getElementById("ingredients").focus();
});

async function generateRecipe(ingredients, vibe, servings, diets, triggerBtn) {
  lastParams = { ingredients, vibe, servings, diets };

  triggerBtn.classList.add("is-loading");
  triggerBtn.disabled = true;
  recipeSection.classList.add("is-visible");
  recipeSection.setAttribute("aria-hidden", "false");
  recipeCard.style.display = "none";
  recipeSection.scrollIntoView({ behavior: "smooth", block: "start" });
  startLoadingMessages();

  try {
    const prompt = buildPrompt(ingredients, vibe, servings, diets, getLang());
    const recipe = await callMistral(prompt);
    recipeCard.style.display = "";
    displayRecipe(recipe);
  } catch (err) {
    recipeCard.style.display = "";
    recipeCard.innerHTML = `<p class="error-message">❌ Erreur : ${escapeHtml(err.message || "Impossible de générer la recette. Réessaie.")}</p>`;
    recipeSection.classList.add("is-visible");
    recipeSection.setAttribute("aria-hidden", "false");
    recipeCard.focus();
  } finally {
    triggerBtn.classList.remove("is-loading");
    triggerBtn.disabled = false;
    stopLoadingMessages();
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const ingredients = document.getElementById("ingredients").value.trim();
  const vibe = vibeInput.value;
  const servings = Number(document.getElementById("servings").value) || 2;

  if (!ingredients) return;

  await generateRecipe(ingredients, vibe, servings, [...selectedDiets], submitBtn);
});

variantBtn.addEventListener("click", async () => {
  if (!lastParams) return;
  await generateRecipe(lastParams.ingredients, lastParams.vibe, lastParams.servings, lastParams.diets, variantBtn);
});

const streamingPreview = document.getElementById("streaming-preview");

async function callMistral(prompt) {
  const key = getApiKey();
  if (!CONFIG.useProxy && !key) {
    toggleApiKeySection();
    throw new Error("Clé API manquante");
  }

  const headers = { "Content-Type": "application/json" };
  if (!CONFIG.useProxy) headers["Authorization"] = `Bearer ${key}`;

  const response = await fetch(CONFIG.useProxy ? CONFIG.proxyUrl : MISTRAL_API_URL, {
    method: "POST",
    headers,
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
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error (${response.status}): ${err}`);
  }

  streamingPreview.textContent = "";
  streamingPreview.style.display = "block";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            content += delta;
            streamingPreview.textContent = content;
            streamingPreview.scrollTop = streamingPreview.scrollHeight;
          }
        } catch {
          // Chunk incomplet, ignoré
        }
      }
    }
  } finally {
    streamingPreview.style.display = "none";
  }

  return JSON.parse(content);
}

function updateFavoriteBtn(recipe) {
  const fav = isFavorite(recipe);
  favoriteBtn.textContent = fav ? "★" : "☆";
  favoriteBtn.classList.toggle("is-favorite", fav);
}

function displayRecipe(recipe, { skipHistory } = {}) {
  currentRecipe = recipe;
  if (!skipHistory) addToHistory(recipe);
  updateFavoriteBtn(recipe);
  const dict = TRANSLATIONS[getLang()];
  recipeTitle.textContent = recipe.title;
  metaPrep.textContent = `${dict.prepLabel} : ${recipe.prep_time}`;
  metaCook.textContent = `${dict.cookLabel} : ${recipe.cook_time}`;
  metaDifficulty.textContent = `${dict.difficultyLabel} : ${recipe.difficulty}`;

  ingredientsList.innerHTML = recipe.ingredients
    .map((ing) => `<li>${escapeHtml(ing)}</li>`)
    .join("");

  stepsList.innerHTML = recipe.steps
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join("");

  recipeTip.textContent = recipe.tip;

  recipeSection.classList.add("is-visible");
  recipeSection.setAttribute("aria-hidden", "false");
  recipeSection.scrollIntoView({ behavior: "smooth", block: "start" });
  recipeCard.focus();
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

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

photoInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const ingredientsInput = document.getElementById("ingredients");

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    const msg = document.getElementById("photo-error");
    msg.textContent = "📷 Image trop lourde (max 5 Mo). Choisis une photo plus légère.";
    msg.style.display = "block";
    setTimeout(() => { msg.style.display = "none"; }, 4000);
    return;
  }

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
  if (!CONFIG.useProxy && !key) throw new Error("Clé API manquante — configure ta clé d'abord.");

  const headers = { "Content-Type": "application/json" };
  if (!CONFIG.useProxy) headers["Authorization"] = `Bearer ${key}`;

  const response = await fetch(CONFIG.useProxy ? CONFIG.proxyUrl : MISTRAL_API_URL, {
    method: "POST",
    headers,
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
