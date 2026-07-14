# Upload these files to GitHub

This ZIP is the complete updated version of your existing SchoolAI project.

## Recommended method

1. Download and extract `SchoolAI-AI-integrated.zip`.
2. Open your existing GitHub repository.
3. Delete the old `ai-question-help-feature` folder if it is still present.
4. Replace the repository files with the files from this updated folder.
5. Commit the changes.
6. Wait for Vercel to redeploy.

The updated project already contains:

- `@google/genai` in `package.json`
- `@google/genai` in `package-lock.json`
- The new `/api/question-help` Vercel function
- Three dots on every question shown in quiz results
- The AI side panel and chat
- School-resource-first answers
- Trusted Google Search fallback when school material is insufficient

## Files changed or added

- `app.js`
- `index.html`
- `styles.css`
- `config.js`
- `vercel.json`
- `package.json`
- `package-lock.json`
- `README.md`
- `api/question-help.js` (new)

## Gemini setup

Keep this Vercel environment variable:

```text
GEMINI_API_KEY = your real Gemini API key
```

Optional model variables:

```text
GEMINI_MODEL = gemini-2.5-flash
GEMINI_WEB_MODEL = gemini-2.5-flash
```

Do not put the API key in GitHub.

## Do you have to run npm install?

Vercel automatically installs dependencies from `package.json` when it deploys.
Because the updated `package.json` and `package-lock.json` already contain
`@google/genai`, you do not have to manually download the library before
uploading this version to GitHub.

For local testing on your own computer, run:

```bash
npm install
npm run dev
```

## Quick deployment test

After Vercel finishes deploying, open:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/api/question-help
```

A browser sends GET, so the expected response is:

```json
{"error":"Use POST."}
```

That confirms the route exists.

Then complete a new practice quiz. On the results page, every question should
show a three-dot button in its upper-right corner.
