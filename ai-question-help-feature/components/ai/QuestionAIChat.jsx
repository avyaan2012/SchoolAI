"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./QuestionAIChat.module.css";

const STARTER_MESSAGE =
  "Ask me why an answer is correct, where the topic appears in your class materials, or for another practice question.";

function makeMessage(role, content, extra = {}) {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    role,
    content,
    ...extra,
  };
}

export default function QuestionAIChat({
  open,
  onClose,
  question,
  quizAttemptId,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open || !question) return;

    setMessages([
      makeMessage("assistant", STARTER_MESSAGE, {
        mode: "intro",
        sources: [],
      }),
    ]);
    setInput("");
    setRequestError("");

    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, question?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape" && open) onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open || !question) return null;

  async function sendMessage(text) {
    const cleanText = text.trim();
    if (!cleanText || loading) return;

    const userMessage = makeMessage("user", cleanText);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setRequestError("");

    try {
      const response = await fetch("/api/ai/question-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizAttemptId,
          question: {
            id: question.id,
            classId: question.classId ?? null,
            topic: question.topic ?? "",
            question: question.question,
            choices: question.choices ?? [],
            studentAnswer: question.studentAnswer ?? "",
            correctAnswer: question.correctAnswer ?? "",
            explanation: question.explanation ?? "",
            /*
             * Supported source shape:
             * [{ id, name, location, text/content, url }]
             *
             * For production, the API also calls the server-side adapter in
             * lib/resources/projectResourceAdapter.js.
             */
            sources:
              question.sources ??
              question.resourceReferences ??
              question.schoolResources ??
              [],
          },
          message: cleanText,
          conversationHistory: messages
            .filter((item) => item.mode !== "intro")
            .slice(-8)
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The AI request failed.");
      }

      setMessages((current) => [
        ...current,
        makeMessage("assistant", data.answer, {
          mode: data.mode,
          sources: Array.isArray(data.sources) ? data.sources : [],
        }),
      ]);
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Something went wrong while asking the AI."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <aside
        className={styles.panel}
        aria-label="AI question help"
        aria-modal="true"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <div className={styles.eyebrow}>AI study help</div>
            <h2 className={styles.title}>Ask about this question</h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close AI help"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <section className={styles.questionCard}>
          <div className={styles.questionLabel}>Quiz question</div>
          <p className={styles.questionText}>{question.question}</p>
          <div className={styles.answerGrid}>
            <div>
              <span>Your answer</span>
              <strong>{question.studentAnswer || "No answer"}</strong>
            </div>
            <div>
              <span>Correct answer</span>
              <strong>{question.correctAnswer || "Not provided"}</strong>
            </div>
          </div>
        </section>

        <div className={styles.messages} aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={
                message.role === "user"
                  ? styles.userMessage
                  : styles.assistantMessage
              }
            >
              <div className={styles.messageRole}>
                {message.role === "user" ? "You" : "AI"}
              </div>
              <div className={styles.messageText}>{message.content}</div>

              {message.role === "assistant" && message.mode === "school" && (
                <div className={styles.modeBadge}>Based on school resources</div>
              )}

              {message.role === "assistant" && message.mode === "web" && (
                <div className={styles.webNotice}>
                  Your school resources did not contain enough information, so
                  trusted web search was used.
                </div>
              )}

              {Array.isArray(message.sources) && message.sources.length > 0 && (
                <div className={styles.sources}>
                  <div className={styles.sourcesTitle}>Resources used</div>
                  {message.sources.map((source, index) =>
                    source.url ? (
                      <a
                        key={`${source.url}-${index}`}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.source}
                      >
                        <strong>{source.name || `Source ${index + 1}`}</strong>
                        {source.location ? ` — ${source.location}` : ""}
                      </a>
                    ) : (
                      <div
                        key={`${source.name}-${index}`}
                        className={styles.source}
                      >
                        <strong>{source.name || `Source ${index + 1}`}</strong>
                        {source.location ? ` — ${source.location}` : ""}
                      </div>
                    )
                  )}
                </div>
              )}
            </article>
          ))}

          {loading && (
            <div className={styles.assistantMessage}>
              <div className={styles.messageRole}>AI</div>
              <div className={styles.loadingDots} aria-label="AI is responding">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {requestError && (
          <div className={styles.error} role="alert">
            {requestError}
          </div>
        )}

        <div className={styles.suggestions}>
          {[
            "Why was my answer wrong?",
            "Explain this more simply.",
            "Give me a similar practice question.",
          ].map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              disabled={loading}
              onClick={() => sendMessage(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form className={styles.composer} onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            rows={2}
            maxLength={1200}
            placeholder="Ask a follow-up question…"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </aside>
    </div>
  );
}
