# ClassQuiz AI - AI Quiz + AI Review Upgrade

ClassQuiz AI is a student-only Google Classroom study app.

This version:

- Connects to Google Classroom
- Imports real class materials
- Reads Google Slides text when permission is available
- Uses Gemini AI to generate larger practice quizzes
- Uses Gemini AI again after the quiz to recommend what to review
- Adds a three-dot menu to every result question with question-specific AI chat
- Suggests class resources first, then web resources like videos, diagrams, notes, and practice

## Important

This version has no demo fallback. It needs Google Classroom access and a Gemini API key.

## Files

The project should look like this:

```text
index.html
styles.css
app.js
config.js
package.json
vercel.json
README.md
api/
  generate-quiz.js
  generate-review.js
  question-help.js
```

## config.js

Keep your Google OAuth Web Client ID here:

```js
const GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com";
const AI_API_URL = "";
```

Leave `AI_API_URL` blank when the whole project is deployed on Vercel.

Do not put the Gemini API key in GitHub.

## Vercel environment variable

Add this in Vercel:

```text
GEMINI_API_KEY = your Gemini API key
```

Then redeploy.

## API routes

After deployment, these should work:

```text
/api/generate-quiz
/api/generate-review
/api/question-help
```

If you open them in a browser, they should say something like:

```json
{"error":"Use POST."}
```

That means the backend route exists.

## Updates in this version

Quiz question options are now 15, 20, and 25 questions.

The quiz generator AI is instructed to cover many different concepts from the imported class materials instead of making a tiny quiz.

The review feature now uses AI. For questions the student gets wrong, it asks Gemini to:

- Recommend exact class materials to review
- Mention slide numbers or slide ranges when slide text includes them
- Explain why that material helps
- Suggest trusted web resources like videos, diagrams, notes, practice, simulations, flashcards, and quizzes
- Create a personalized study plan


## Question-level AI help

On the quiz-results page, every question now has a three-dot menu. Choose
**Ask AI about this question** to open a matching side panel.

The AI:

1. Receives the question, choices, student answer, correct answer, and recent chat.
2. Searches the imported materials used for that quiz.
3. Answers strictly from those school excerpts when they contain enough information.
4. Names the exact class resource and slide/page range when available.
5. Uses Gemini Google Search grounding only when the school excerpts are insufficient.
6. Clearly labels whether school materials or trusted web sources were used.

The backend route is:

```text
/api/question-help
```

`@google/genai` is already included in `package.json` and `package-lock.json`.
The question-help endpoint uses it for the Google Search fallback. Do not add
the old `ai-question-help-feature` React folder; this project uses vanilla
HTML, CSS, and JavaScript.
