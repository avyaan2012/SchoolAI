# AI Question Help — installation

This folder is a drop-in integration for a Next.js App Router project.

## 1. Copy the folders

Copy these folders into the root of your existing project:

- `app`
- `components`
- `lib`

The example file is optional:

- `examples/QuizResultCard.example.jsx`

If your project uses a `src` folder, place them under `src` instead:

- `src/app`
- `src/components`
- `src/lib`

Then update import paths if your project does not support the same relative paths.

## 2. Install the Gemini SDK

Run:

```bash
npm install @google/genai
```

Do not replace your complete `package.json` with `package-additions.json`.
That small file only shows the dependency that must be added.

## 3. Add environment variables

Create or update `.env.local`:

```env
GEMINI_API_KEY=your_real_key
GEMINI_MODEL=gemini-3.5-flash
```

In Vercel, add the same values under:

`Project → Settings → Environment Variables`

Never use a variable beginning with `NEXT_PUBLIC_` for the Gemini key.

## 4. Add the three-dot menu to the current quiz-results card

Import:

```jsx
import { useState } from "react";
import QuestionAIChat from "@/components/ai/QuestionAIChat";
import QuestionOptionsMenu from "@/components/quiz/QuestionOptionsMenu";
```

Inside the result-card component:

```jsx
const [aiOpen, setAiOpen] = useState(false);
```

Place this beside the question heading:

```jsx
<QuestionOptionsMenu onAskAI={() => setAiOpen(true)} />
```

Place this after the result card:

```jsx
<QuestionAIChat
  open={aiOpen}
  onClose={() => setAiOpen(false)}
  question={question}
  quizAttemptId={quizAttemptId}
/>
```

A complete example is in `examples/QuizResultCard.example.jsx`.

## 5. Make sure each question contains useful source excerpts

Recommended shape:

```js
{
  id: "question-6",
  classId: "biology",
  topic: "Domains and Kingdoms",
  question: "Which domain contains organisms without a nucleus?",
  choices: ["Eukarya", "Bacteria", "Animalia", "Protista"],
  studentAnswer: "Eukarya",
  correctAnswer: "Bacteria",
  explanation: "Bacteria are prokaryotes.",
  sources: [
    {
      id: "slides-19-21",
      name: "Unit 2 Biology Slides",
      location: "Slides 19–21",
      text: "The exact relevant text extracted from these slides...",
      url: "/resources/unit-2-slides"
    }
  ]
}
```

The AI uses these school sources first.

If no source has a useful text excerpt, the API turns on Gemini's Google
Search grounding and tells the student that outside web resources were used.

## 6. Connect the real school-resource database

Edit:

`lib/resources/projectResourceAdapter.js`

The adapter receives:

- `questionId`
- `classId`
- `topic`
- `searchText`

Make it query your existing resource chunks and return:

```js
[
  {
    id: "chunk-id",
    name: "Unit 2 Biology Slides",
    location: "Slides 19–21",
    text: "Relevant extracted content...",
    url: "/resources/unit-2-slides"
  }
]
```

This is the correct place to connect Google Classroom, Schoology, Prisma,
Supabase, or another resource store. It runs only on the server.

## 7. Add your authentication check

Open:

`app/api/ai/question-help/route.js`

Find the `IMPORTANT AUTH HOOK` comment. Connect it to your current login
system and verify:

1. The quiz attempt belongs to the signed-in student.
2. The question belongs to that attempt.
3. The student has access to the class resources.

## 8. Test locally

Run:

```bash
npm run dev
```

Complete a quiz, open its results, click the three dots on a question, and
choose **Ask AI about this question**.

Test both paths:

1. A question with `sources[].text` should say **Based on school resources**.
2. A question without source text should say that web search was used.

## Important implementation notes

- The Gemini API key is used only inside the Vercel/Next.js route.
- The route uses the current `@google/genai` SDK and Interactions API.
- The model can be changed with `GEMINI_MODEL`.
- A simple rate limiter is included. Replace it with Redis/KV for a larger
  production deployment.
- The source adapter is deliberately separate so the UI and AI logic do not
  need to change when your resource database changes.
