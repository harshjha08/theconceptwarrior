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
| Students      | Enroll (generates ID + one-time password), search, disable/enable access, delete, export CSV, last-login tracking |
| Content       | Recorded lectures, notes and assignments; grade student submissions with marks + feedback |
| Question Bank | Add / delete questions (feeds daily quiz, practice and live tests); filter by subject |
| Live Test     | Start a timed test, watch students join and answer in real time, see tab-switch warnings, end it, get a leaderboard |
| Messages      | Message one student or everyone; read and reply to student messages |
| Announcements | Publish / delete; students are notified instantly |
| Security      | Session info, change admin password, password-reset requests (share the code by phone/WhatsApp) |

"Live" means Socket.IO: the admin screens update without refreshing. The green **Live** pill in the top bar shows the connection state.
Students receive instant in-app popups for live tests, announcements, messages, and learning updates. The matching student navigation tab shows its unread count; opening that tab clears the count.

## Security measures built in
- Passwords (admin and students) stored as salted scrypt hashes, compared in constant time
- Admin session expires after 2 hours idle; logout invalidates the token server-side
- Brute-force protection: repeated failed sign-ins lock that client out for 15 minutes (admin, student and public forms)
- Bearer-token auth in an Authorization header (not cookies), so it is not exposed to CSRF
- Student tokens cannot call admin endpoints; Socket.IO admin events go only to authenticated admin sockets
- All user-supplied text is HTML-escaped before display; link URLs are limited to http(s)
- Security headers (nosniff, frame-deny, no-referrer), `x-powered-by` removed, admin page marked noindex
- Audit trail of logins, enrollments, password changes, test start/end in the activity feed

## Free deployment (Render + Neon)

The repository includes a `render.yaml` Blueprint for a $0 Render web service. It serves the existing website, LMS, admin console, APIs, and Socket.IO from the same origin. LMS records are stored as one JSON document in PostgreSQL, so content and accounts survive web-service restarts.

1. Push the repository to GitHub and create a free PostgreSQL project at [Neon](https://neon.tech/). Copy its pooled connection string (the URL must include the SSL settings Neon provides).
2. If you need existing local LMS data, import it now, before creating the Render service. See “Moving local data” below. Skip this if you want a clean production database.
3. In [Render](https://render.com/), create a new Blueprint and select this GitHub repository. Render reads `render.yaml` and creates the web service.
4. In the Render service's Environment settings, add `DATABASE_URL` with the Neon connection string and `ADMIN_PASSWORD` with a new, unique password of at least 12 characters. Do not put either secret in GitHub.
5. Wait for deployment to finish, then open the service's `onrender.com` URL. The website, student portal (`/lms/`), and admin console (`/lms/admin.html`) are all served from that URL.
6. If you did not import local data, sign in as `admin` with the `ADMIN_PASSWORD` value you set. If you imported `db.json`, its existing admin password is preserved; sign in with that password and change it in the Security screen if needed. A local demo student exists only when importing local data; create other accounts from the Students screen.

This stays within the providers' free tiers, subject to their current quotas and policies. Render's free web service sleeps after inactivity and can take about a minute to wake. It has an ephemeral filesystem, so hosted records are saved to Neon, not `db.json`. When the backend restarts, active logins and a running live test are interrupted; users may need to sign in again and the admin may need to restart the test. Live notifications work while the service and clients are connected, but free hosting does not guarantee uninterrupted 24/7 availability. Neon Free can also scale its database compute to zero while idle.

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
