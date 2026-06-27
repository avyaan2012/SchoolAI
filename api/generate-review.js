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
    const { className, topic, weakTopics, wrongAnswers, materials } = req.body || {};

    if (!Array.isArray(wrongAnswers) || wrongAnswers.length === 0) {
      return res.status(400).json({ error: "No missed questions were provided to the AI review endpoint." });
    }

    if (!Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({ error: "No class materials were provided to the AI review endpoint." });
    }

    const compactMaterials = materials
      .slice(0, 14)
      .map((material, index) => {
        return [
          `SOURCE ${index + 1}`,
          `id: ${material.id}`,
          `title: ${material.title}`,
          `type: ${material.type}`,
          `url: ${material.url || ""}`,
          `slide_text_imported: ${material.hasExtractedSlideText ? "yes" : "no"}`,
          `text:\n${String(material.text || "").slice(0, 5000)}`
        ].join("\n");
      })
      .join("\n\n---\n\n");

    const compactWrongAnswers = wrongAnswers
      .slice(0, 12)
      .map((item, index) => {
        return [
          `MISSED QUESTION ${index + 1}`,
          `question: ${item.questionText}`,
          `student_answer: ${item.studentAnswer}`,
          `correct_answer: ${item.correctAnswer}`,
          `weak_topic: ${item.weakTopic}`,
          `source_material_id: ${item.sourceMaterialId}`,
          `source_material_title: ${item.sourceMaterialTitle}`,
          `question_explanation: ${item.explanation}`
        ].join("\n");
      })
      .join("\n\n");

    const prompt = `
You are an AI study coach for a student-only school study app.
The student took a quiz and missed some questions.
Use AI to create a review plan.

Class: ${className || "Unknown class"}
Quiz topic: ${topic || "general review"}
Weak topics: ${Array.isArray(weakTopics) ? weakTopics.join(", ") : "unknown"}

MISSED QUESTIONS:
${compactWrongAnswers}

CLASS MATERIALS:
${compactMaterials}

Rules for class resource recommendations:
- Recommend ONLY class resources that exist in the provided CLASS MATERIALS.
- Do not invent a class resource.
- Be specific about what to review.
- If the material text contains slide labels like "Slide 19:", cite exact slide numbers or a range, like "Review slides 19-21 on domains and kingdoms.".
- Connect each recommendation to at least one missed question.

Rules for web resource recommendations:
- After class resources, suggest useful web resources for the weak topics.
- Include a mix when helpful: videos, diagrams, notes/articles, practice exercises, simulations, flashcards.
- Prefer student-safe educational sources like Khan Academy, CK-12, Crash Course, PhET, Britannica, NASA, NOAA, National Geographic Education, PBS LearningMedia, or university/education websites.
- If you are not completely sure of an exact URL, leave url as an empty string and provide a good searchQuery.
- Do not pretend web resources are teacher/class resources.

Return ONLY valid JSON in this exact shape:
{
  "classResourceRecommendations": [
    {
      "sourceMaterialId": "id from CLASS MATERIALS",
      "title": "exact title from CLASS MATERIALS",
      "type": "slides, assignment, material, etc",
      "slideRange": "Slides 19-21, or empty string if not known",
      "specificReview": "specific advice like Review slides 19-21 on domains and kingdoms",
      "reason": "why this helps based on the missed question",
      "relatedWrongQuestion": "short version of the missed question"
    }
  ],
  "webResourceRecommendations": [
    {
      "title": "useful resource title or search idea",
      "type": "Video, Diagram, Notes, Article, Practice, Simulation, Flashcards, Quiz",
      "sourceName": "trusted source name",
      "url": "real URL only if you are confident, otherwise empty string",
      "searchQuery": "specific search query the student can use",
      "reason": "why this helps"
    }
  ],
  "studyPlan": [
    "step 1",
    "step 2"
  ]
}
`.trim();

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
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
          temperature: 0.35,
          responseMimeType: "application/json",
          maxOutputTokens: 10000
        }
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.error?.message || `Gemini returned ${response.status}`;
      return res.status(response.status).json({ error: message });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("\n").trim();
    if (!text) {
      return res.status(500).json({ error: "Gemini returned no review text." });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Gemini did not return valid review JSON.");
      parsed = JSON.parse(jsonMatch[0]);
    }

    const review = normalizeReview(parsed, materials, wrongAnswers, topic);
    return res.status(200).json({ review });
  } catch (error) {
    return res.status(500).json({ error: error.message || "AI review generation failed." });
  }
};

function normalizeReview(parsed, materials, wrongAnswers, topic) {
  const classRecsRaw = Array.isArray(parsed.classResourceRecommendations) ? parsed.classResourceRecommendations : [];
  const webRecsRaw = Array.isArray(parsed.webResourceRecommendations) ? parsed.webResourceRecommendations : [];
  const studyPlanRaw = Array.isArray(parsed.studyPlan) ? parsed.studyPlan : [];

  const classResourceRecommendations = classRecsRaw.slice(0, 6).map((rec, index) => {
    const source = materials.find(m => m.id === rec.sourceMaterialId)
      || materials.find(m => m.title === rec.title)
      || materials.find(m => m.id === wrongAnswers[index]?.sourceMaterialId)
      || materials[0];

    return {
      sourceMaterialId: source?.id || "",
      title: source?.title || String(rec.title || "Class resource"),
      type: String(rec.type || source?.type || "Class Resource"),
      url: source?.url || "",
      slideRange: String(rec.slideRange || ""),
      specificReview: String(rec.specificReview || rec.reason || `Review ${source?.title || "the class material"} for ${topic || "this topic"}.`),
      reason: String(rec.reason || "This matches one of the missed questions."),
      relatedWrongQuestion: String(rec.relatedWrongQuestion || wrongAnswers[index]?.questionText || "Missed quiz question")
    };
  });

  const webResourceRecommendations = webRecsRaw.slice(0, 8).map(rec => {
    const searchQuery = String(rec.searchQuery || `${topic || "class topic"} ${rec.type || "study resource"}`).trim();
    return {
      title: String(rec.title || searchQuery),
      type: String(rec.type || "Resource"),
      sourceName: String(rec.sourceName || "Trusted educational web"),
      url: String(rec.url || ""),
      searchQuery,
      reason: String(rec.reason || "This gives another explanation or practice for the missed topic.")
    };
  });

  const studyPlan = studyPlanRaw.slice(0, 8).map(String).filter(Boolean);

  return {
    classResourceRecommendations,
    webResourceRecommendations,
    studyPlan
  };
}
