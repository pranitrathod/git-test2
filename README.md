# JobPilot — Personal Career Workspace

A single-user, browser-based job-search workspace for one owner.

## Open the app

Once GitHub Pages is enabled and the deployment workflow succeeds, the app will be available at:

https://pranitrathod.github.io/git-test2/

## What it does

- Fetches real listings from Remotive and Arbeitnow public job APIs when you press Search.
- Scores jobs against an editable local profile and skill list using a transparent keyword heuristic.
- Saves jobs, tracks application stages, and generates recruiter outreach drafts.
- Supports local PDF/DOCX resume text extraction in the browser.
- Exports and imports a JSON backup of your personal workspace.

## Privacy

No login or server-side profile is used. Profile details, extracted resume text, saved jobs, applications, and drafts are stored in the browser's local storage. They are not committed to this repository or sent to the job APIs. Local browser storage is not encrypted; do not use a shared computer. Export a backup before clearing browser data.

## Important limitations

- Search runs only when you open the app and press Refresh. It does not run in the background when the browser is closed.
- Job match scores are heuristic estimates, not ATS scores or hiring decisions.
- Application submission and recruiter email sending are manual. Never mark an application as submitted unless you have actually submitted it.
- Always confirm current job availability, eligibility, location and requirements on the original listing.
- Remotive listings may be delayed by 24 hours; the app shows the Remotive source and links to the original listing. Remotive advises no more than four API requests per day.

## Sources

- Remotive: https://remotive.com/api/remote-jobs
- Arbeitnow: https://www.arbeitnow.com/api/job-board-api?page=1
