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
    const { topic, count, className, subject, materials } = req.body || {};

    if (!Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({ error: "No class materials were provided to the AI." });
    }

    const questionCount = Math.max(5, Math.min(Number(count) || 15, 25));
    const context = materials
      .slice(0, 12)
      .map((material, index) => {
        return [
          `SOURCE ${index + 1}`,
          `id: ${material.id}`,
          `title: ${material.title}`,
          `type: ${material.type}`,
          `slide_text_imported: ${material.hasExtractedSlideText ? "yes" : "no"}`,
          `text:\n${String(material.text || "").slice(0, 3500)}`
        ].join("\n");
      })
      .join("\n\n---\n\n");

    const prompt = `
You are an educational quiz generator for a student-only study app.
Create ${questionCount} multiple-choice practice questions using ONLY the provided class materials.
The quiz must cover many different ideas from the class resources, not just one tiny topic.
Make the questions varied: definitions, comparisons, examples, cause/effect, classification, and application when the source allows it.
Avoid repeating the same answer choice pattern or asking the same question in different words.
Use multiple sources when possible. Prefer actual extracted Google Slides text when available.
If slide text contains labels like "Slide 19:", include exact slide numbers or slide ranges in reviewHint/slideRange.
Do not use outside knowledge unless the material is too vague; if you must infer, keep it basic and say it is based on the provided material.

Class: ${className || "Unknown class"}
Subject guess: ${subject || "general"}
Requested topic: ${topic || "general review"}

Class materials:
${context}

Return ONLY valid JSON in this exact shape:
{
  "questions": [
    {
      "questionText": "string",
      "choices": ["A", "B", "C", "D"],
      "correctAnswer": "one exact choice from choices",
      "explanation": "short explanation based on the source material",
      "weakTopic": "short topic label",
      "sourceMaterialId": "id of the most relevant source",
      "sourceMaterialTitle": "title of the most relevant source",
      "reviewHint": "specific class review advice, ideally including slide numbers/ranges if shown in the source",
      "slideRange": "example: Slides 19-21, or empty string if not known"
    }
  ]
}
`.trim();

    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
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
          temperature: 0.45,
          responseMimeType: "application/json",
          maxOutputTokens: 16000
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
      return res.status(500).json({ error: "Gemini returned no text." });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Gemini did not return valid JSON.");
      parsed = JSON.parse(jsonMatch[0]);
    }

    const questions = normalizeQuestions(parsed.questions, materials, questionCount);
    return res.status(200).json({ questions });
  } catch (error) {
    return res.status(500).json({ error: error.message || "AI quiz generation failed." });
  }
}

function normalizeQuestions(questions, materials, count) {
  if (!Array.isArray(questions)) return [];

  return questions.slice(0, count).map((question, index) => {
    const source = materials.find(m => m.id === question.sourceMaterialId)
      || materials.find(m => m.title === question.sourceMaterialTitle)
      || materials[0];

    let choices = Array.isArray(question.choices)
      ? question.choices.map(String).filter(Boolean)
      : [];

    let correctAnswer = String(question.correctAnswer || choices[0] || "Review the source material");
    if (!choices.includes(correctAnswer)) choices.unshift(correctAnswer);

    choices = [...new Set(choices)].slice(0, 4);
    while (choices.length < 4) {
      choices.push(["Not stated in the source", "A different class topic", "Ask the teacher", "None of the above"][choices.length] || `Option ${choices.length + 1}`);
    }

    return {
      questionText: String(question.questionText || `Question ${index + 1}`),
      choices,
      correctAnswer,
      explanation: String(question.explanation || "This is based on the imported class material."),
      weakTopic: String(question.weakTopic || "class material"),
      sourceMaterialId: source?.id || "",
      sourceMaterialTitle: source?.title || "Imported resource",
      reviewHint: String(question.reviewHint || "Review the linked source material for this topic."),
      slideRange: String(question.slideRange || "")
    };
  });
}
