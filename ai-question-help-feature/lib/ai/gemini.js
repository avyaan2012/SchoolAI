import { GoogleGenAI } from "@google/genai";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add it to .env.local and Vercel Environment Variables."
    );
  }

  return new GoogleGenAI({ apiKey });
}

function collectWebSources(
  value,
  results = [],
  seenUrls = new Set(),
  visitedObjects = new WeakSet()
) {
  if (!value || typeof value !== "object") return results;
  if (visitedObjects.has(value)) return results;
  visitedObjects.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      collectWebSources(item, results, seenUrls, visitedObjects);
    }
    return results;
  }

  /*
   * The Interactions API exposes citation annotations in model output.
   * This deliberately accepts a few field-name variations so the UI stays
   * resilient across compatible SDK response shapes.
   */
  const possibleUrl =
    value.url ??
    value.uri ??
    value.sourceUrl ??
    value.source_url ??
    value?.urlCitation?.url ??
    value?.url_citation?.url;

  if (
    typeof possibleUrl === "string" &&
    /^https?:\/\//i.test(possibleUrl) &&
    !seenUrls.has(possibleUrl)
  ) {
    seenUrls.add(possibleUrl);
    results.push({
      name:
        value.title ??
        value.name ??
        value?.urlCitation?.title ??
        value?.url_citation?.title ??
        "Web resource",
      location: "Web",
      url: possibleUrl,
    });
  }

  for (const child of Object.values(value)) {
    collectWebSources(child, results, seenUrls, visitedObjects);
  }

  return results;
}

export async function generateStudyAnswer({ prompt, allowWebSearch }) {
  const client = getClient();
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  const request = {
    model,
    input: prompt,
  };

  if (allowWebSearch) {
    request.tools = [{ type: "google_search" }];
  }

  const interaction = await client.interactions.create(request);
  const text = interaction.output_text?.trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return {
    text,
    sources: allowWebSearch
      ? collectWebSources(interaction.steps ?? interaction)
      : [],
  };
}
