# ClassQuiz AI - AI Quiz + AI Review Upgrade

ClassQuiz AI is a student-only Google Classroom study app.

This version:

- Connects to Google Classroom
- Imports real class materials
- Reads Google Slides text when permission is available
- Uses Gemini AI to generate larger practice quizzes
- Uses Gemini AI again after the quiz to recommend what to review
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
