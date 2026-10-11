# The Concept Warriors — Website + LMS + Admin Console

## Run it
1. Install Node.js 18 or newer
2. In this folder: `npm install` then `npm start`
3. Open:
   - Existing project website: http://localhost:3000
   - Student portal: http://localhost:3000/lms/
   - Admin console:  http://localhost:3000/lms/admin.html
4. From the existing project root, use `npm install --prefix backend` and `npm start --prefix backend`. The server serves the existing root website and LMS together. Legacy student/admin URLs redirect to the real LMS.

## First login
- Admin:        username `admin`, password `admin123`  →  Security tab → Change password
- Demo student: `CW2601` / `demo1234`
- The default admin is for local development only. Production requires an `ADMIN_PASSWORD` of at least 12 characters on first startup.

## Admin console — what it manages
| Screen        | What you can do |
|---------------|-----------------|
| Overview      | KPI tiles, live activity feed (new leads, messages, submissions, resets appear instantly), quick actions |
| Leads         | Every Callback / Demo / Enroll form from the website. Filter, search, set status (New → Contacted → Converted), tap-to-call / tap-to-email, delete, export CSV |
| Students      | Record student/guardian contact information, course/class, fees and payments; generate an ID + one-time password; automatically lock accounts with a fee balance; search, manage access and payment history, and export student and fee records |
| Content       | Recorded lectures, notes and assignments; grade student submissions with marks + feedback |
| Question Bank | Add MCQ or written questions across common subjects; choose “Other” to enter an exact subject name; add / delete questions used for quizzes, practice and live tests |
| Live Test     | Choose specific questions or keep random selection, mix MCQs and manually graded written answers, optionally show/hide a live objective-score leaderboard, configure tab-switch auto-submission, monitor students, and review written answers |
| Messages      | Message one student or everyone; read and reply to student messages |
| Announcements | Publish / delete; students are notified instantly |
| Security      | Session info, change admin password, password-reset requests (share the code by phone/WhatsApp) |

"Live" means Socket.IO: the admin screens update without refreshing. The green **Live** pill in the top bar shows the connection state.
Students receive instant in-app notifications and optional sound effects for live tests, announcements, messages, and learning updates. The matching student navigation tab shows its unread count; opening that tab clears the count. The student portal includes a responsive mobile navigation and exam layout.

Students with an outstanding enrollment fee cannot sign in or access authenticated LMS actions. Record a payment from **Students → fee icon** to update the payment history; LMS access becomes available automatically once the remaining balance reaches zero. A live leaderboard is opt-in per test and can be switched on or off by the admin while it is running. Written answers count toward the final score after the tutor reviews and grades them.

## Security measures built in
- Passwords (admin and students) stored as salted scrypt hashes, compared in constant time
- Admin session expires after 2 hours idle; logout invalidates the token server-side
- Brute-force protection: repeated failed sign-ins lock that client out for 15 minutes (admin, student and public forms)
- Bearer-token auth in an Authorization header (not cookies), so it is not exposed to CSRF
- Student tokens cannot call admin endpoints; Socket.IO admin events go only to authenticated admin sockets
- All user-supplied text is HTML-escaped before display; link URLs are limited to http(s)
- Security headers (nosniff, frame-deny, no-referrer), `x-powered-by` removed, admin page marked noindex
- Audit trail of logins, enrollments, password changes, test start/end in the activity feed

## Free deployment (Vercel + Render + Neon)

The public website is intended to be indexed at `https://theconceptwarrior.vercel.app/`. The repository's `vercel.json` sends student/admin legacy URLs to Render, and the public Student LMS links point to the Render portal. Render continues to serve the same static pages as a fallback, plus the LMS, admin console, APIs, and Socket.IO; its HTML responses are marked `noindex` to avoid duplicate search results. LMS records are stored as one JSON document in PostgreSQL, so content and accounts survive web-service restarts.

1. Push the repository to GitHub and create a free PostgreSQL project at [Neon](https://neon.tech/). Copy its pooled connection string (the URL must include the SSL settings Neon provides).
2. If you need existing local LMS data, import it now, before creating the Render service. See “Moving local data” below. Skip this if you want a clean production database.
3. In [Render](https://render.com/), create a new Blueprint and select this GitHub repository. Render reads `render.yaml` and creates the web service. The Blueprint also configures the public Vercel origin for the website-lead API.
4. In the Render service's Environment settings, add `DATABASE_URL` with the Neon connection string and `ADMIN_PASSWORD` with a new, unique password of at least 12 characters. Confirm `FRONTEND_ORIGIN` is set to `https://theconceptwarrior.vercel.app`. Do not put either secret in GitHub.
5. In [Vercel](https://vercel.com/), import the same GitHub repository with the project root as the root directory. Vercel detects the static website and applies the redirects from `vercel.json`. Git pushes to `main` trigger deployment on both providers.
6. Wait for deployment to finish. The Vercel URL is the public website; its Student LMS links open the Render portal. The admin console is at `https://theconceptwarriors.onrender.com/lms/admin.html`; keep it bookmarked privately rather than linking it from the public site.
7. If you did not import local data, sign in as `admin` with the `ADMIN_PASSWORD` value you set. If you imported `db.json`, its existing admin password is preserved; sign in with that password and change it in the Security screen if needed. A local demo student exists only when importing local data; create other accounts from the Students screen.

This stays within the providers' free tiers, subject to their current quotas and policies. Render's free web service sleeps after inactivity and can take about a minute to wake. It has an ephemeral filesystem, so hosted records are saved to Neon, not `db.json`. When the backend restarts, active logins and a running live test are interrupted; users may need to sign in again and the admin may need to restart the test. Live notifications work while the service and clients are connected, but free hosting does not guarantee uninterrupted 24/7 availability. Neon Free can also scale its database compute to zero while idle.

Submit only the Vercel public sitemap (`https://theconceptwarrior.vercel.app/sitemap.xml`) in Google Search Console. Student sign-in and admin pages should stay out of search results; the Render HTML pages send `noindex` and the LMS login page includes a `noindex` meta tag.

The local `backend/db.json` is git-ignored and is not uploaded to Render. To move existing local accounts/content, import it once from your computer while the destination Neon database is empty, **before the first Render deployment starts**. Importing preserves the current admin password hash; the Render `ADMIN_PASSWORD` value only creates credentials for a fresh database.

```powershell
$env:DATABASE_URL = 'paste-your-Neon-connection-string-here'
npm run import:db --prefix backend
Remove-Item Env:DATABASE_URL
```

The importer refuses to overwrite an initialized destination. If you skip the import, the hosted LMS starts with sample question-bank content and no demo student; enroll students from the admin console. Keep a private backup before deployment; never commit `db.json` or database credentials.

## Before going live (important)
- **Serve over HTTPS.** Without it, passwords and tokens travel in clear text. Use a host or reverse proxy that provides TLS.
- Set `ADMIN_PASSWORD` in the hosting provider's environment settings before the first production start. Do not commit passwords or `.env` files.
- For hosted deployments, configure `DATABASE_URL` to a PostgreSQL database. Local development continues to use `db.json`.
- The Render free tier supports this hobby deployment but sleeps when idle; it is not an always-on production SLA.
- Back up the database file. Deleting it resets all LMS data.
- Sessions are held in memory: restarting the server signs everyone out (data is kept).
- There is a single admin account.

## Files
```
server.js        Express + Socket.IO backend (all APIs, auth, live test)
db.json          created on first run (your data)
lms/index.html, app.js, style.css     student portal
lms/admin.html, admin.js, admin.css   admin console
```
The public website is served directly from the repository root; it is not duplicated in this backend folder.
