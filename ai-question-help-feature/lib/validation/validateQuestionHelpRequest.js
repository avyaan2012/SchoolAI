function asText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function validateQuestionHelpRequest(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." };
  }

  const message = asText(body.message, 1200);
  const rawQuestion = body.question;

  if (!message) {
    return { ok: false, error: "Please enter a question for the AI." };
  }

  if (!rawQuestion || typeof rawQuestion !== "object") {
    return { ok: false, error: "Quiz-question context is missing." };
  }

  const questionText = asText(rawQuestion.question, 5000);

  if (!questionText) {
    return { ok: false, error: "The quiz question is missing." };
  }

  const history = Array.isArray(body.conversationHistory)
    ? body.conversationHistory
        .slice(-8)
        .map((item) => ({
          role: item?.role === "assistant" ? "assistant" : "user",
          content: asText(item?.content, 2000),
        }))
        .filter((item) => item.content)
    : [];

  const sources = Array.isArray(rawQuestion.sources)
    ? rawQuestion.sources.slice(0, 12)
    : [];

  return {
    ok: true,
    data: {
      quizAttemptId: asText(body.quizAttemptId, 200),
      message,
      conversationHistory: history,
      question: {
        id: asText(rawQuestion.id, 200),
        classId: asText(rawQuestion.classId, 200),
        topic: asText(rawQuestion.topic, 500),
        question: questionText,
        choices: Array.isArray(rawQuestion.choices)
          ? rawQuestion.choices
              .slice(0, 12)
              .map((choice) => asText(String(choice), 1000))
          : [],
        studentAnswer: asText(rawQuestion.studentAnswer, 2000),
        correctAnswer: asText(rawQuestion.correctAnswer, 2000),
        explanation: asText(rawQuestion.explanation, 5000),
        sources,
      },
    },
  };
}
