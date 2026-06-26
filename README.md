# ClassQuiz AI

ClassQuiz AI is a student-only study website that connects to Google Classroom, imports class materials, reads attached Google Slides when possible, and uses Gemini AI to generate practice quiz questions.

## What this project does

* Connects to Google Classroom
* Imports real classes, coursework, and class materials
* Reads Google Slides text when permission is available
* Uses Gemini AI to generate practice quiz questions
* Shows quiz results and explanations
* Helps students study from their actual class resources

## Important notes

This is a prototype/testing version.

There is:

* No teacher mode
* No admin mode
* No class codes
* No demo fallback data

The app only works after connecting Google Classroom.

## Files

The project should be organized like this:

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
```

## Setup

### 1. Google Client ID

Open `config.js` and paste your Google OAuth Web Client ID:

```js
const GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com";
```

Keep this blank if the whole project is deployed on Vercel:

```js
const AI_API_URL = "";
```

Do not put your Gemini API key in `config.js`.

### 2. Google APIs to enable

In Google Cloud Console, enable:

* Google Classroom API
* Google Slides API

### 3. OAuth scopes

Add these scopes to your OAuth consent screen:

```text
https://www.googleapis.com/auth/classroom.courses.readonly
https://www.googleapis.com/auth/classroom.coursework.me.readonly
https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly
https://www.googleapis.com/auth/presentations.readonly
```

### 4. Authorized JavaScript origin

In Google Cloud Console, add the Vercel URL as an authorized JavaScript origin:

```text
https://your-project-name.vercel.app
```

Do not include a slash at the end.

### 5. Gemini API key

In Vercel, add this environment variable:

```text
GEMINI_API_KEY = your Gemini API key
```

Do not put the Gemini API key in GitHub.

### 6. Deploy

Deploy the project on Vercel.

After deployment, test:

```text
https://your-project-name.vercel.app/
```

The API route should be:

```text
https://your-project-name.vercel.app/api/generate-quiz
```

If the API route says:

```json
{"error":"Use POST."}
```

that means the backend API exists and is working.

## Current limitations

This version can read Google Classroom data and Google Slides text when permissions allow it.

It does not fully read:

* PDFs
* Google Docs
* videos
* images
* worksheets

Those can be added in a later version.
