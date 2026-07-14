const MAX_HISTORY_MESSAGES = 10;
const MAX_MATERIALS = 8;
const MAX_MATERIAL_TEXT = 6000;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Missing GEMINI_API_KEY. Add it as an environment variable in Vercel."
    });
  }

  try {
    const body = req.body || {};
    const question = normalizeQuestion(body.question);
    const message = cleanText(body.message, 1400);
    const conversationHistory = normalizeHistory(body.conversationHistory);
    const materials = rankSchoolMaterials(
      normalizeMaterials(body.materials),
      question,
      message
    );

    if (!question.questionText) {
      return res.status(400).json({ error: "The quiz question is missing." });
    }

    if (!message) {
      return res.status(400).json({ error: "Please enter a question for the AI." });
    }

    /*
     * First, ask Gemini to answer strictly from the imported school resources.
     * Gemini also reports whether those excerpts actually contain enough
     * information. The web is used only when the answer is false.
     */
    if (materials.length > 0) {
      const schoolResult = await generateSchoolAnswer({
        apiKey,
        question,
        message,
        conversationHistory,
        materials
      });

      if (schoolResult.enoughSchoolInfo && schoolResult.answer) {
        return res.status(200).json({
          answer: schoolResult.answer,
          mode: "school",
          sources: normalizeSchoolSources(
            schoolResult.sources,
            materials,
            question
          ),
          followUpSuggestions: normalizeSuggestions(
            schoolResult.followUpSuggestions
          )
        });
      }
    }

    const webResult = await generateWebAnswer({
      apiKey,
      question,
      message,
      conversationHistory
    });

    return res.status(200).json({
      answer: webResult.answer,
      mode: "web",
      sources: webResult.sources,
      followUpSuggestions: normalizeSuggestions(webResult.followUpSuggestions)
    });
  } catch (error) {
    console.error("Question-help API failed:", error);
    return res.status(500).json({
      error: error?.message || "The AI could not answer right now."
    });
  }
};

async function generateSchoolAnswer({
  apiKey,
  question,
  message,
  conversationHistory,
  materials
}) {
  const materialContext = materials
    .map((material, index) => {
      return [
        `SCHOOL SOURCE ${index + 1}`,
        `id: ${material.id}`,
        `title: ${material.title}`,
        `type: ${material.type || "Class Resource"}`,
        `location: ${material.location || "Relevant section"}`,
        `text:`,
        material.text
      ].join("\n");
    })
    .join("\n\n---\n\n");

  const historyText = formatHistory(conversationHistory);

  const prompt = `
You are the AI study helper inside a student's completed quiz-results page.

IMPORTANT SOURCE RULE:
- First decide whether the SCHOOL SOURCES below contain enough information to answer the student's current question accurately.
- Use ONLY those school sources for factual claims when enoughSchoolInfo is true.
- Do not add outside facts, even if you know them.
- Never claim a slide/page says something unless that idea appears in the provided text.
- If the source material is incomplete, unrelated, or too vague, set enoughSchoolInfo to false. The app will then use trusted web search.

HELPFULNESS RULES:
- Be specific and teach the idea. Do not only say "review your notes."
- Directly address the quiz question and the student's exact message.
- When relevant, explain why the student's answer was wrong and why the correct answer is right.
- Mention the exact resource title and slide/page/section location.
- Use a concrete comparison, example, or memory tip when the school source supports it.
- Use clear language for a middle-school or high-school student.
- This is a completed practice quiz, not a live graded test.
- Do not reveal hidden reasoning or chain-of-thought.
- Keep the answer focused, usually 2-6 short paragraphs.

QUIZ CONTEXT
Class: ${question.className || "Unknown class"}
Topic: ${question.topic || question.weakTopic || "Class topic"}
Question: ${question.questionText}
Choices:
${formatChoices(question.choices)}
Student answer: ${question.studentAnswer || "No answer"}
Correct answer: ${question.correctAnswer || "Not provided"}
Quiz explanation: ${question.explanation || "Not provided"}
Original AI review hint: ${question.reviewHint || "Not provided"}
Original source: ${question.sourceMaterialTitle || "Not provided"}
Original slide/page range: ${question.slideRange || "Not provided"}

RECENT CHAT
${historyText}

CURRENT STUDENT MESSAGE
${message}

SCHOOL SOURCES
${materialContext}

Return ONLY valid JSON in this shape:
{
  "enoughSchoolInfo": true,
  "answer": "specific plain-text explanation",
  "sources": [
    {
      "sourceMaterialId": "exact id from SCHOOL SOURCES",
      "title": "exact source title",
      "location": "exact slide/page/section location"
    }
  ],
  "followUpSuggestions": [
    "short follow-up question",
    "short follow-up question",
    "short follow-up question"
  ]
}
`.trim();

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.25,
          responseMimeType: "application/json",
          maxOutputTokens: 5000
        }
      })
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage =
      data?.error?.message || `Gemini returned ${response.status}`;
    throw new Error(apiMessage);
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini returned no school-resource answer.");
  }

  const parsed = parseJsonObject(text);

  return {
    enoughSchoolInfo: parsed.enoughSchoolInfo === true,
    answer: cleanOutputText(parsed.answer, 9000),
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    followUpSuggestions: parsed.followUpSuggestions
  };
}

async function generateWebAnswer({
  apiKey,
  question,
  message,
  conversationHistory
}) {
  const prompt = `
You are the AI study helper inside a student's completed quiz-results page.
The imported school materials did not contain enough information for this request,
so use Google Search to provide a careful outside explanation.

Rules:
- Give specific teaching, not vague study advice.
- Directly answer the student's current message.
- Explain the quiz concept, including why the student's answer was wrong and why the correct answer is right when relevant.
- Prefer reliable educational sources: universities, government sites, recognized museums, Britannica, Khan Academy, CK-12, and established educational publishers.
- Do not pretend web information came from the student's teacher or class.
- Clearly begin with: "Your class resources did not contain enough information for this, so I used trusted web sources."
- Use clear language for a middle-school or high-school student.
- This is a completed practice quiz, not a live graded assessment.
- Do not reveal hidden reasoning or chain-of-thought.
- Keep the answer focused, usually 2-6 short paragraphs.

QUIZ CONTEXT
Class: ${question.className || "Unknown class"}
Topic: ${question.topic || question.weakTopic || "Class topic"}
Question: ${question.questionText}
Choices:
${formatChoices(question.choices)}
Student answer: ${question.studentAnswer || "No answer"}
Correct answer: ${question.correctAnswer || "Not provided"}
Existing explanation: ${question.explanation || "Not provided"}

RECENT CHAT
${formatHistory(conversationHistory)}

CURRENT STUDENT MESSAGE
${message}
`.trim();

  /*
   * The project already includes @google/genai. The Interactions API gives the
   * web fallback Google Search grounding and returns citation annotations.
   */
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const client = new GoogleGenAI({ apiKey });
    const interaction = await client.interactions.create({
      model:
        process.env.GEMINI_WEB_MODEL ||
        process.env.GEMINI_MODEL ||
        "gemini-2.5-flash",
      input: prompt,
      tools: [{ type: "google_search" }]
    });

    const answer = cleanOutputText(
      interaction.output_text || interaction.outputText,
      10000
    );

    if (!answer) {
      throw new Error("Gemini returned no web-grounded answer.");
    }

    return {
      answer,
      sources: extractWebSources(interaction),
      followUpSuggestions: defaultSuggestions(question)
    };
  } catch (sdkError) {
    console.error(
      "Google GenAI SDK web search failed; trying the REST Interactions API:",
      sdkError
    );

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          model:
            process.env.GEMINI_WEB_MODEL ||
            process.env.GEMINI_MODEL ||
            "gemini-2.5-flash",
          input: prompt,
          tools: [{ type: "google_search" }]
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiMessage =
        data?.error?.message ||
        sdkError?.message ||
        `Gemini web search returned ${response.status}`;
      throw new Error(apiMessage);
    }

    const answer = cleanOutputText(data.output_text || data.outputText, 10000);
    if (!answer) {
      throw new Error("Gemini returned no web-grounded answer.");
    }

    return {
      answer,
      sources: extractWebSources(data),
      followUpSuggestions: defaultSuggestions(question)
    };
  }
}

function normalizeQuestion(raw) {
  const question = raw && typeof raw === "object" ? raw : {};

  return {
    id: cleanText(question.id, 200),
    className: cleanText(question.className, 300),
    topic: cleanText(question.topic, 500),
    questionText: cleanText(
      question.questionText || question.question,
      5000
    ),
    choices: Array.isArray(question.choices)
      ? question.choices.slice(0, 12).map(choice => cleanText(choice, 1000))
      : [],
    studentAnswer: cleanText(question.studentAnswer, 2000),
    correctAnswer: cleanText(question.correctAnswer, 2000),
    explanation: cleanText(question.explanation, 5000),
    weakTopic: cleanText(question.weakTopic, 500),
    sourceMaterialId: cleanText(question.sourceMaterialId, 300),
    sourceMaterialTitle: cleanText(question.sourceMaterialTitle, 600),
    reviewHint: cleanText(question.reviewHint, 2000),
    slideRange: cleanText(question.slideRange, 300)
  };
}

function normalizeHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];

  return rawHistory
    .slice(-MAX_HISTORY_MESSAGES)
    .map(message => ({
      role: message?.role === "assistant" ? "assistant" : "user",
      content: cleanText(message?.content, 2500)
    }))
    .filter(message => message.content);
}

function normalizeMaterials(rawMaterials) {
  if (!Array.isArray(rawMaterials)) return [];

  return rawMaterials
    .slice(0, 16)
    .map((material, index) => {
      const item =
        material && typeof material === "object" ? material : {};

      return {
        id: cleanText(item.id || `material-${index + 1}`, 300),
        title: cleanText(
          item.title || item.name || `Class resource ${index + 1}`,
          600
        ),
        type: cleanText(item.type, 200),
        url: cleanText(item.url, 2000),
        text: cleanText(item.text || item.content || item.excerpt, MAX_MATERIAL_TEXT),
        hasExtractedSlideText: !!item.hasExtractedSlideText,
        location: cleanText(
          item.location || item.slideRange || item.pages || item.section,
          300
        )
      };
    })
    .filter(material => material.text.length >= 60);
}

function rankSchoolMaterials(materials, question, message) {
  const searchText = [
    question.topic,
    question.weakTopic,
    question.questionText,
    question.correctAnswer,
    message
  ]
    .filter(Boolean)
    .join(" ");

  const terms = tokenize(searchText);

  return materials
    .map(material => {
      const materialTerms = tokenize(
        `${material.title} ${material.location} ${material.text}`
      );

      let score = 0;
      for (const term of terms) {
        if (materialTerms.has(term)) score += 1;
      }

      if (
        question.sourceMaterialId &&
        material.id === question.sourceMaterialId
      ) {
        score += 1000;
      }

      if (
        question.sourceMaterialTitle &&
        material.title === question.sourceMaterialTitle
      ) {
        score += 800;
      }

      return {
        ...material,
        location:
          material.location ||
          (material.id === question.sourceMaterialId
            ? question.slideRange
            : "") ||
          inferLocation(material.text),
        score
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATERIALS)
    .map(({ score, ...material }) => material);
}

function tokenize(value) {
  return new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter(word => word.length >= 4)
  );
}

function inferLocation(text) {
  const slideNumbers = [
    ...String(text || "").matchAll(/\bslide\s+(\d{1,4})\b/gi)
  ]
    .map(match => Number(match[1]))
    .filter(Number.isFinite);

  if (slideNumbers.length === 0) return "Relevant section";

  const minimum = Math.min(...slideNumbers);
  const maximum = Math.max(...slideNumbers);
  return minimum === maximum
    ? `Slide ${minimum}`
    : `Slides ${minimum}-${maximum}`;
}

function normalizeSchoolSources(rawSources, materials, question) {
  const normalized = Array.isArray(rawSources)
    ? rawSources
        .slice(0, 5)
        .map(source => {
          const matchingMaterial =
            materials.find(
              material =>
                material.id === cleanText(source?.sourceMaterialId, 300)
            ) ||
            materials.find(
              material => material.title === cleanText(source?.title, 600)
            );

          if (!matchingMaterial) return null;

          return {
            name: matchingMaterial.title,
            location:
              matchingMaterial.location ||
              (matchingMaterial.id === question.sourceMaterialId
                ? question.slideRange
                : "") ||
              "Relevant section",
            url: matchingMaterial.url || ""
          };
        })
        .filter(Boolean)
    : [];

  if (normalized.length > 0) return dedupeSources(normalized);

  const first = materials[0];
  return first
    ? [
        {
          name: first.title,
          location:
            first.location ||
            (first.id === question.sourceMaterialId
              ? question.slideRange
              : "") ||
            "Relevant section",
          url: first.url || ""
        }
      ]
    : [];
}

function extractWebSources(value) {
  const sources = [];
  const seenUrls = new Set();
  const visitedObjects = new WeakSet();

  function visit(item) {
    if (!item || typeof item !== "object") return;
    if (visitedObjects.has(item)) return;
    visitedObjects.add(item);

    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }

    const type = String(item.type || item.annotationType || "").toLowerCase();
    const hasCitationShape =
      type.includes("citation") ||
      !!item.urlCitation ||
      !!item.url_citation ||
      (
        (Number.isFinite(item.startIndex) ||
          Number.isFinite(item.start_index)) &&
        (Number.isFinite(item.endIndex) ||
          Number.isFinite(item.end_index))
      );

    const url =
      item.url ||
      item.uri ||
      item.sourceUrl ||
      item.source_url ||
      item?.urlCitation?.url ||
      item?.url_citation?.url;

    if (
      hasCitationShape &&
      typeof url === "string" &&
      /^https?:\/\//i.test(url) &&
      !seenUrls.has(url)
    ) {
      seenUrls.add(url);
      sources.push({
        name:
          cleanText(
            item.title ||
              item.name ||
              item?.urlCitation?.title ||
              item?.url_citation?.title,
            500
          ) || "Web resource",
        location: "Web",
        url
      });
    }

    Object.values(item).forEach(visit);
  }

  visit(value);
  return sources.slice(0, 8);
}

function dedupeSources(sources) {
  const seen = new Set();

  return sources.filter(source => {
    const key = `${source.name}|${source.location}|${source.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeSuggestions(rawSuggestions) {
  const suggestions = Array.isArray(rawSuggestions)
    ? rawSuggestions
        .map(suggestion => cleanText(suggestion, 180))
        .filter(Boolean)
        .slice(0, 4)
    : [];

  return suggestions.length > 0
    ? suggestions
    : [
        "Explain that more simply.",
        "Give me a similar practice question.",
        "What should I review in the class resource?"
      ];
}

function defaultSuggestions(question) {
  return [
    "Explain that more simply.",
    `Give me a practice question about ${question.weakTopic || question.topic || "this topic"}.`,
    "Compare the correct answer with my answer."
  ];
}

function formatChoices(choices) {
  if (!Array.isArray(choices) || choices.length === 0) {
    return "Not provided";
  }

  return choices
    .map(
      (choice, index) =>
        `${String.fromCharCode(65 + index)}. ${String(choice)}`
    )
    .join("\n");
}

function formatHistory(history) {
  if (!history.length) return "No earlier messages.";

  return history
    .map(
      message =>
        `${message.role === "assistant" ? "AI" : "STUDENT"}: ${message.content}`
    )
    .join("\n");
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Gemini did not return valid JSON.");
    }
    return JSON.parse(match[0]);
  }
}

function cleanOutputText(value, maxLength = 9000) {
  if (typeof value !== "string") {
    if (value === null || value === undefined) return "";
    value = String(value);
  }

  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

function cleanText(value, maxLength = 5000) {
  if (typeof value !== "string") {
    if (value === null || value === undefined) return "";
    value = String(value);
  }

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}
