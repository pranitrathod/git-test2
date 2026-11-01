# JobPilot — Personal Career Workspace

A single-user, browser-based career workspace. No account, signup or subscription is required.

## Hosting

After GitHub Pages is enabled with **Settings → Pages → Build and deployment → Source: GitHub Actions**, the site will be available at:

https://pranitrathod.github.io/git-test2/

The deployment workflow runs a syntax/smoke-test gate, refreshes the public job cache, then publishes the static site. A scheduled refresh is configured once per day (00:20 UTC).

## Features

- Live job discovery from Remotive and Arbeitnow when the user presses Search.
- Daily cached remote-engineering discovery from Himalayas and Jobicy, refreshed by the deployment workflow.
- Explainable keyword-based matching against the editable profile and skill list.
- Job filters for keyword, location, work arrangement, freshness and match score.
- Saved and hidden jobs, application pipeline, notes and follow-up dates.
- Job-specific cover-letter and recruiter outreach drafts.
- PDF/DOCX text extraction in the browser.
- PWA install support and an offline application shell.
- JSON export/import backups.

## Privacy and data storage

No login or server-side candidate profile is used. Candidate profile details, extracted resume text, saved/hidden jobs, application history, notes and drafts stay in the browser's local storage. They are not included in the repository, public job cache or API requests.

Browser local storage is not encrypted. Anyone with access to the same browser profile can view its data. Use a trusted personal device and export a private backup regularly. Do not use a shared/public computer.

## Honest limitations

- Public job feeds are not a complete index of all vacancies. Himalayas and Jobicy focus on remote listings; Arbeitnow has a strong Europe focus. The user must confirm eligibility and current status at the original listing.
- Match scores are transparent keyword heuristics, not ATS scores, an employer's decision or a guarantee of eligibility.
- Job refresh is manual for the live browser sources; the two cached sources update through a daily hosted workflow. This app does not search in the background continuously.
- Job application submission and recruiter email sending are not automated. Application portals remain manual; a status is only marked Submitted when the user confirms it.
- Do not bypass CAPTCHA, login barriers or anti-bot protections; do not guess answers to mandatory questions.
- Remotive listings are delayed by 24 hours and its public API advises no more than four calls per day. Jobicy's public API contains recent remote listings; source attribution and original listing links are retained.
- Local browser data is not synced across devices. Export a backup before clearing site data or changing browser profiles.

## Public sources and API terms

- Remotive: https://remotive.com/remote-jobs/api
- Arbeitnow: https://www.arbeitnow.com/api/job-board-api
- Himalayas: https://himalayas.app/docs/remote-jobs-api
- Jobicy: https://jobicy.com/jobs-rss-feed
