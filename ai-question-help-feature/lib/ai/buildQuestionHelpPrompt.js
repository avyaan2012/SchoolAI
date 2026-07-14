function clean(value, fallback = "Not provided") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function formatChoices(choices) {
  if (!Array.isArray(choices) || choices.length === 0) return "Not provided";

  return choices
    .slice(0, 12)
    .map((choice, index) => `${String.fromCharCode(65 + index)}. ${choice}`)
    .join("\n");
}

function formatConversation(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return "No earlier conversation.";
  }

  return history
    .slice(-8)
    .map((message) => {
      const role = message.role === "assistant" ? "AI" : "STUDENT";
      return `${role}: ${clean(message.content, "")}`;
    })
    .join("\n");
}

function formatResources(resources) {
  return resources
    .map((resource, index) => {
      return [
        `[School ${index + 1}]`,
        `Name: ${resource.name}`,
        `Location: ${resource.location || "Location not provided"}`,
        `Content:`,
        resource.text,
      ].join("\n");
    })
    .join("\n\n");
}

export function buildQuestionHelpPrompt({
  question,
  studentMessage,
  conversationHistory,
  schoolResources,
  useWeb,
}) {
  const sourceRules = useWeb
    ? `
No adequate school-resource excerpt was available. Use Google Search grounding.
Prefer reliable educational sources such as universities, government science sites,
Britannica, Khan Academy, recognized museums, and established educational publishers.
State clearly that the explanation uses outside web resources.
Do not pretend that web information came from the student's school.
`
    : `
Use ONLY the SCHOOL RESOURCES included below for factual claims.
Do not use outside knowledge to add facts that are missing from those resources.
Cite useful school material naturally by its exact name and location, such as:
"Review Unit 2 Slides, slides 19–21."
Use the resource content to teach the idea, not merely to tell the student to review it.
`;

  return `
You are a patient, specific school study assistant.

Your goals:
- Directly answer the student's question.
- Explain why the student's answer is wrong when it is wrong.
- Explain why the correct answer is correct.
- Point to exact school resource names and slide/page/section locations when available.
- Use concrete details, examples, comparisons, memory tricks, or a brief practice problem when useful.
- Never give vague advice such as only saying "study more" or "review your notes."
- Use clear language suitable for a middle-school or high-school student.
- Do not reveal hidden reasoning or internal chain-of-thought.
- Do not help cheat on a live graded assessment. This request comes from a completed quiz-results screen.
- Keep the answer focused. Usually 2–6 short paragraphs is enough.
- Plain text is preferred. Short headings are allowed. Do not use a markdown table.

${sourceRules}

QUIZ CONTEXT
Topic: ${clean(question.topic)}
Question: ${clean(question.question)}
Choices:
${formatChoices(question.choices)}
Student's answer: ${clean(question.studentAnswer)}
Correct answer: ${clean(question.correctAnswer)}
Existing quiz explanation: ${clean(question.explanation)}

SCHOOL RESOURCES
${
  schoolResources.length > 0
    ? formatResources(schoolResources)
    : "No adequate school-resource excerpt was found."
}

RECENT CONVERSATION
${formatConversation(conversationHistory)}

CURRENT STUDENT MESSAGE
${clean(studentMessage)}

Write the helpful answer now.
`.trim();
}
