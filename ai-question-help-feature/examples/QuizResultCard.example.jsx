"use client";

import { useState } from "react";
import QuestionAIChat from "../components/ai/QuestionAIChat";
import QuestionOptionsMenu from "../components/quiz/QuestionOptionsMenu";

/**
 * Copy the important parts of this example into your current quiz-results
 * component. You do not have to replace your existing card design.
 */
export default function QuizResultCardExample({
  question,
  quizAttemptId,
  questionNumber,
}) {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <article
        style={{
          position: "relative",
          padding: 20,
          border: "1px solid #cccccc",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              Question {questionNumber}
            </div>
            <h3>{question.question}</h3>
          </div>

          <QuestionOptionsMenu onAskAI={() => setAiOpen(true)} />
        </div>

        <p>
          <strong>Your answer:</strong> {question.studentAnswer}
        </p>
        <p>
          <strong>Correct answer:</strong> {question.correctAnswer}
        </p>
      </article>

      <QuestionAIChat
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        question={question}
        quizAttemptId={quizAttemptId}
      />
    </>
  );
}

/*
Expected question shape:

const question = {
  id: "question-6",
  classId: "honors-biology",
  topic: "Domains and Kingdoms",
  question: "Which domain contains organisms without a nucleus?",
  choices: ["Eukarya", "Bacteria", "Animalia", "Protista"],
  studentAnswer: "Eukarya",
  correctAnswer: "Bacteria",
  explanation: "Bacteria are prokaryotes and do not have a nucleus.",

  // Attach the exact source excerpts used to create this quiz question.
  // When these are missing, the API uses Gemini Google Search grounding.
  sources: [
    {
      id: "unit-2-slides-19-21",
      name: "Unit 2 Biology Slides",
      location: "Slides 19–21",
      text:
        "Prokaryotic cells do not contain a nucleus. Bacteria and Archaea " +
        "are prokaryotic, while organisms in Eukarya have cells with nuclei.",
      url: "/resources/unit-2-biology-slides",
    },
  ],
};
*/
