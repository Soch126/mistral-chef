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

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const HISTORY_KEY = "mistral_chef_history";
const HISTORY_MAX = 10;

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

// Si un déploiement fournit un proxy serverless (voir api/mistral.js), on l'utilise
// pour éviter de demander une clé API à chaque utilisateur. Sinon on reste en mode
// "Bring Your Own Key" (comportement par défaut, clé stockée dans le navigateur).
const CONFIG = {
  useProxy: Boolean(window.MISTRAL_CHEF_USE_PROXY),
  proxyUrl: "/api/mistral",
};

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

historyList.addEventListener("click", (e) => {
  const btn = e.target.closest(".history-item");
  if (!btn) return;
  const history = getHistory();
  const recipe = history[Number(btn.dataset.index)];
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

newRecipeBtn.addEventListener("click", () => {
  recipeSection.classList.remove("is-visible");
  recipeSection.setAttribute("aria-hidden", "true");
  form.scrollIntoView({ behavior: "smooth" });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const ingredients = document.getElementById("ingredients").value.trim();
  const vibe = vibeInput.value;
  const servings = Number(document.getElementById("servings").value) || 2;

  if (!ingredients) return;

  submitBtn.classList.add("is-loading");
  submitBtn.disabled = true;
  recipeSection.classList.add("is-visible");
  recipeSection.setAttribute("aria-hidden", "false");
  recipeCard.style.display = "none";
  recipeSection.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const prompt = buildPrompt(ingredients, vibe, servings);
    const recipe = await callMistral(prompt);
    recipeCard.style.display = "";
    displayRecipe(recipe);
  } catch (err) {
    recipeCard.style.display = "";
    recipeCard.innerHTML = `<p class="error-message">❌ Erreur : ${escapeHtml(err.message || "Impossible de générer la recette. Réessaie.")}</p>`;
    recipeSection.classList.add("is-visible");
    recipeSection.setAttribute("aria-hidden", "false");
  } finally {
    submitBtn.classList.remove("is-loading");
    submitBtn.disabled = false;
  }
});

function buildPrompt(ingredients, vibe, servings) {
  return `Tu es un grand chef cuisinier. À partir des ingrédients suivants : "${ingredients}", et avec une ambiance "${vibe}", crée une recette complète et originale pour ${servings} personne(s). Adapte les quantités des ingrédients au nombre de personnes.

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

function displayRecipe(recipe, { skipHistory } = {}) {
  currentRecipe = recipe;
  if (!skipHistory) addToHistory(recipe);

  recipeTitle.textContent = recipe.title;
  metaPrep.textContent = `⏱️ Préparation : ${recipe.prep_time}`;
  metaCook.textContent = `🔥 Cuisson : ${recipe.cook_time}`;
  metaDifficulty.textContent = `📊 Difficulté : ${recipe.difficulty}`;

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
