# ClassQuiz AI MVP

This is a simple student-only AI study website MVP.

It is made with plain HTML, CSS, and JavaScript so it is easy to paste into GitHub and host with GitHub Pages.

## What it does

- Simulates connecting Google Classroom or Schoology
- Imports demo classes and class materials
- Generates practice quizzes from demo class materials
- Shows quiz results and weak topics
- Recommends class resources first
- Suggests trusted web resources when class resources are not enough
- Creates a simple study plan
- Saves data in browser localStorage

## Important

This version does not use real Google Classroom, Schoology, Prisma, or AI APIs yet.
It is an MVP/demo version so you can show the idea and test the user flow.

## Files

- `index.html` - website structure
- `styles.css` - design and layout
- `app.js` - app logic, quiz generation, recommendations, localStorage

## How to use on GitHub Pages

1. Create a new GitHub repository.
2. Add these files to the root of the repository:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md`
3. Go to Repository Settings.
4. Go to Pages.
5. Under Build and deployment, choose Deploy from a branch.
6. Select the `main` branch and `/root` folder.
7. Save.
8. Open the GitHub Pages link when it finishes deploying.

## Future upgrades

- Real Google Classroom OAuth connection
- Real Schoology connection
- Real AI quiz generation
- User accounts
- Database storage
- Teacher-safe/privacy controls
