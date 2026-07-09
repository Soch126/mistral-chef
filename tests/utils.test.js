const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildPrompt, recipeToText } = require("../js/utils.js");

test("buildPrompt defaults to French", () => {
  const prompt = buildPrompt("poulet, riz", "healthy", 4);
  assert.match(prompt, /Tu es un grand chef cuisinier/);
  assert.match(prompt, /poulet, riz/);
  assert.match(prompt, /healthy/);
  assert.match(prompt, /4 personne\(s\)/);
});

test("buildPrompt switches to English when lang is 'en'", () => {
  const prompt = buildPrompt("chicken, rice", "quick", 2, [], "en");
  assert.match(prompt, /You are a great chef/);
  assert.match(prompt, /chicken, rice/);
  assert.match(prompt, /2 serving\(s\)/);
  assert.doesNotMatch(prompt, /Tu es un grand chef/);
});

test("buildPrompt omits the dietary constraint clause when no diets are selected", () => {
  const promptFr = buildPrompt("oeufs", "classique", 1, []);
  assert.doesNotMatch(promptFr, /Contrainte alimentaire/);

  const promptEn = buildPrompt("eggs", "classic", 1, [], "en");
  assert.doesNotMatch(promptEn, /Critical dietary constraint/);
});

test("buildPrompt includes every selected diet in the constraint clause (French)", () => {
  const prompt = buildPrompt("tofu", "healthy", 2, ["vegan", "sans-gluten"]);
  assert.match(prompt, /Contrainte alimentaire impérative/);
  assert.match(prompt, /vegan, sans-gluten/);
});

test("buildPrompt includes every selected diet in the constraint clause (English)", () => {
  const prompt = buildPrompt("tofu", "healthy", 2, ["vegan", "gluten-free"], "en");
  assert.match(prompt, /Critical dietary constraint/);
  assert.match(prompt, /vegan, gluten-free/);
});

test("recipeToText renders every recipe field in a readable plain-text block", () => {
  const recipe = {
    title: "Poulet au citron",
    prep_time: "10 min",
    cook_time: "25 min",
    difficulty: "Facile",
    ingredients: ["1 poulet", "2 citrons"],
    steps: ["Découper le poulet", "Faire cuire"],
    tip: "Arroser régulièrement.",
  };

  const text = recipeToText(recipe);

  assert.match(text, /^Poulet au citron/);
  assert.match(text, /Préparation : 10 min/);
  assert.match(text, /Cuisson : 25 min/);
  assert.match(text, /Difficulté : Facile/);
  assert.match(text, /- 1 poulet/);
  assert.match(text, /- 2 citrons/);
  assert.match(text, /1\. Découper le poulet/);
  assert.match(text, /2\. Faire cuire/);
  assert.match(text, /Astuce du chef : Arroser régulièrement\./);
});

test("recipeToText numbers steps starting at 1 regardless of array length", () => {
  const recipe = {
    title: "T",
    prep_time: "-",
    cook_time: "-",
    difficulty: "-",
    ingredients: [],
    steps: ["a", "b", "c"],
    tip: "-",
  };
  const text = recipeToText(recipe);
  assert.match(text, /1\. a/);
  assert.match(text, /2\. b/);
  assert.match(text, /3\. c/);
});
