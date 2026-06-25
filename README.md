# ClassQuiz AI - Google Classroom Only Test

This version removes demo/fallback classes. It only imports real Google Classroom data after OAuth permission.

## Files

- `index.html` - website page
- `styles.css` - styling
- `app.js` - Google Classroom sync and quiz logic
- `config.js` - paste your Google OAuth Web Client ID here

## Setup

1. Open `config.js`.
2. Replace `PASTE_YOUR_GOOGLE_CLIENT_ID_HERE` with your Google OAuth Web Client ID.
3. Upload all 4 files to your GitHub repository.
4. Commit changes.
5. Open your GitHub Pages site.
6. Click **Connect Google Classroom**.

## Google OAuth settings reminder

In Google Cloud, your OAuth client should include your GitHub Pages origin:

`https://YOUR-GITHUB-USERNAME.github.io`

Use read-only Classroom scopes:

- `https://www.googleapis.com/auth/classroom.courses.readonly`
- `https://www.googleapis.com/auth/classroom.coursework.me.readonly`
- `https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly`

## Important limitations

- This is a browser-only test version.
- It does not store Google refresh tokens.
- You may need to reconnect after refreshing the page.
- It imports Classroom titles, descriptions, links, and attachment metadata.
- It does not extract the full text inside Google Docs, Slides, or PDFs yet.
- The quiz generator is simple and for testing. A real AI generator should be added later.
