import { buildQuestionHelpPrompt } from "../../../../lib/ai/buildQuestionHelpPrompt";
import { generateStudyAnswer } from "../../../../lib/ai/gemini";
import { getSchoolResourceContext } from "../../../../lib/resources/getSchoolResourceContext";
import { validateQuestionHelpRequest } from "../../../../lib/validation/validateQuestionHelpRequest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function rateLimitKey(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/*
 * Lightweight single-instance limiter. For production across multiple Vercel
 * instances, replace this with Upstash Redis, Vercel KV, or your database.
 */
const buckets = globalThis.__questionAiRateBuckets ?? new Map();
globalThis.__questionAiRateBuckets = buckets;

function isRateLimited(key) {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 15;

  const recent = (buckets.get(key) ?? []).filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (recent.length >= maxRequests) {
    buckets.set(key, recent);
    return true;
  }

  recent.push(now);
  buckets.set(key, recent);
  return false;
}

function publicSchoolSources(resources) {
  return resources.map(({ name, location, url }) => ({
    name,
    location,
    url,
  }));
}

export async function POST(request) {
  try {
    const key = rateLimitKey(request);

    if (isRateLimited(key)) {
      return Response.json(
        { error: "Too many AI requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = validateQuestionHelpRequest(body);

    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const {
      question,
      message,
      conversationHistory,
      quizAttemptId,
    } = validation.data;

    /*
     * IMPORTANT AUTH HOOK:
     * Verify the signed-in user owns quizAttemptId and can access question.classId.
     * Add your existing auth/database check here before retrieving private resources.
     *
     * Example:
     * const session = await auth();
     * await assertQuizAttemptAccess(session.user.id, quizAttemptId, question.id);
     */
    void quizAttemptId;

    const schoolContext = await getSchoolResourceContext({
      question,
      studentMessage: message,
    });

    const useWeb = !schoolContext.hasAdequateSchoolContext;

    const prompt = buildQuestionHelpPrompt({
      question,
      studentMessage: message,
      conversationHistory,
      schoolResources: schoolContext.resources,
      useWeb,
    });

    const result = await generateStudyAnswer({
      prompt,
      allowWebSearch: useWeb,
    });

    return Response.json({
      answer: result.text,
      mode: useWeb ? "web" : "school",
      sources: useWeb
        ? result.sources
        : publicSchoolSources(schoolContext.resources),
    });
  } catch (error) {
    console.error("Question AI error:", error);

    const message =
      error instanceof Error && error.message.includes("GEMINI_API_KEY")
        ? error.message
        : "The AI could not answer right now. Please try again.";

    return Response.json({ error: message }, { status: 500 });
  }
}
