import { loadProjectSchoolResources } from "./projectResourceAdapter";

const MAX_RESOURCES = 6;
const MAX_CHARS_PER_RESOURCE = 5000;
const MIN_USEFUL_TEXT_LENGTH = 80;

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS_PER_RESOURCE);
}

function normalizeResource(resource, index) {
  if (!resource || typeof resource !== "object") return null;

  const text = normalizeText(
    resource.text ??
      resource.content ??
      resource.excerpt ??
      resource.pageText ??
      ""
  );

  if (text.length < MIN_USEFUL_TEXT_LENGTH) return null;

  return {
    id: String(resource.id ?? `resource-${index + 1}`),
    name: String(
      resource.name ??
        resource.resourceName ??
        resource.title ??
        `School resource ${index + 1}`
    ),
    location: String(
      resource.location ??
        resource.pages ??
        resource.slides ??
        resource.section ??
        ""
    ),
    text,
    url:
      typeof resource.url === "string"
        ? resource.url
        : typeof resource.sourceUrl === "string"
          ? resource.sourceUrl
          : "",
  };
}

function tokenize(text) {
  return new Set(
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3)
  );
}

function relevanceScore(resource, searchText) {
  const queryWords = tokenize(searchText);
  const resourceWords = tokenize(
    `${resource.name} ${resource.location} ${resource.text}`
  );

  let matches = 0;
  for (const word of queryWords) {
    if (resourceWords.has(word)) matches += 1;
  }

  return matches;
}

export async function getSchoolResourceContext({ question, studentMessage }) {
  const searchText = [
    question.topic,
    question.question,
    question.studentAnswer,
    question.correctAnswer,
    studentMessage,
  ]
    .filter(Boolean)
    .join(" ");

  let projectResources = [];

  try {
    projectResources = await loadProjectSchoolResources({
      questionId: question.id,
      classId: question.classId,
      topic: question.topic,
      searchText,
    });
  } catch (error) {
    console.error("School-resource adapter failed:", error);
  }

  const attachedResources = Array.isArray(question.sources)
    ? question.sources
    : [];

  const normalized = [...projectResources, ...attachedResources]
    .map(normalizeResource)
    .filter(Boolean);

  const unique = [];
  const seen = new Set();

  for (const resource of normalized) {
    const key = `${resource.name}|${resource.location}|${resource.text.slice(0, 120)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(resource);
  }

  const ranked = unique
    .map((resource) => ({
      ...resource,
      score: relevanceScore(resource, searchText),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESOURCES)
    .map(({ score, ...resource }) => resource);

  return {
    resources: ranked,
    hasAdequateSchoolContext: ranked.length > 0,
  };
}
