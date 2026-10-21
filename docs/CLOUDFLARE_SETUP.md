# Put Home Study on Cloudflare — Beginner Guide

This is a self-contained setup guide. It does not assume that a developer or chat assistant is waiting for a reply.

The instructions explain what to click, what command to run, what result to expect, and what to do when the expected result does not appear.

The final website address will be:

```text
https://study.saneax.in
```

## Current setup status

At the time this guide was updated:

- `saneax.in` is present in Cloudflare and its status is **Active**.
- The source code is in `Incorpify-LLC/home_study` on GitHub.
- Production deployment is manual; a normal push to GitHub does not deploy the website.
- The production Worker, D1 database, D1 schema, private R2 buckets, and custom domain have been verified.
- Cloudflare Access protects the site with email OTP and an exact identity allowlist; email reports are not enabled yet.

If the Cloudflare account or domain status changes later, use the decision path in Part A.

---

# What Cloudflare will contain

The application uses four Cloudflare services:

1. **Worker** — runs the website and its API.
2. **D1 database** — stores users, questions, assignments, answers, and progress.
3. **R2 buckets** — privately store photographs of rough work.
4. **Cloudflare Access** — authenticates only approved family email addresses using one-time PINs.

The setup creates these resources:

```text
Worker:      home-study
D1 database: home-study
R2 bucket:   home-study-rough-work
R2 preview:  home-study-rough-work-preview
Domain:      study.saneax.in
```

## Safety rules

- Never place passwords, API tokens, one-time login codes, or recovery codes in this repository, an issue, a screenshot, or chat.
- Do not make either R2 bucket public.
- Do not enable an `r2.dev` public address for either bucket.
- Do not point `study.saneax.in` to a home IP address or another server.
- Do not enable progress-report email until its content and recipient have been approved.

---

# Part A — Check the Cloudflare domain

## Step A1: Find `saneax.in`

1. Open [dash.cloudflare.com](https://dash.cloudflare.com/).
2. Sign in to the Cloudflare account that should host the application.
3. Open **Websites** or **Domains**.
4. Look for `saneax.in`.

## Step A2: Follow the matching path

### Path 1 — `saneax.in` is visible and says **Active**

The prerequisite is satisfied. Continue to **Part B — Connect Wrangler to Cloudflare**.

This is the current known state for this project.

### Path 2 — `saneax.in` is visible but is not **Active**

1. Click `saneax.in`.
2. Read the status message shown by Cloudflare.
3. If Cloudflare says that the nameservers are incorrect or pending:
   - open the website where the domain was purchased;
   - replace the domain’s nameservers with the two nameservers displayed by Cloudflare;
   - save the change;
   - return to Cloudflare and wait for activation.
4. Nameserver changes may take time to propagate.
5. Do not continue to deployment until the domain status becomes **Active**.

If the registrar screen is unfamiliar, stop before changing anything and obtain help from the person who manages the domain registration. Copy the nameservers exactly; do not change individual DNS records as a substitute.

### Path 3 — `saneax.in` is not visible

First check the account name shown in the top-right corner of Cloudflare.

- If another Cloudflare account owns the domain, sign out and sign in to that account.
- If the domain has never been added to Cloudflare:
  1. click **Add a domain** or **Onboard a domain**;
  2. enter `saneax.in`—not `study.saneax.in`;
  3. select the Free plan unless a paid feature is intentionally required;
  4. review the imported DNS records carefully;
  5. follow Cloudflare’s nameserver instructions at the domain registrar;
  6. wait until the domain becomes **Active**.

Do not continue until `saneax.in` appears as **Active**.

---

# Part B — Connect Wrangler to Cloudflare

Wrangler is Cloudflare’s command-line program. It is included in this project through npm.

## Step B1: Open a terminal on pi09

Change to the project directory:

```bash
cd ~/workspace/personal/family/home_study
```

Confirm that this is the correct repository:

```bash
git remote -v
```

The output should mention:

```text
git@github.com:Incorpify-LLC/home_study.git
```

If it shows another repository, stop and change to the correct directory.

## Step B2: Start Cloudflare login

Run:

```bash
npx wrangler login
```

Wrangler displays a Cloudflare authorization link and may try to open it automatically.

1. Open that link in a browser.
2. Sign in to the Cloudflare account that contains the Active `saneax.in` domain.
3. Review the authorization request.
4. Click **Allow** or **Authorize**.
5. Return to the terminal.

Expected terminal result: Wrangler reports that login succeeded.

### If no browser opens

Copy the complete URL printed in the terminal and open it manually in a browser where Cloudflare is signed in.

### If the wrong Cloudflare account opens

Cancel the authorization, sign out of Cloudflare in that browser, sign in to the correct account, and run `npx wrangler login` again.

### Verify the login

Run:

```bash
npx wrangler whoami
```

The output should show the expected Cloudflare account. Do not continue if the account is wrong.

---

# Part C — Create the database and private image storage

Run all commands from:

```text
~/workspace/personal/family/home_study
```

## Step C1: Check whether the resources already exist

Run:

```bash
npx wrangler d1 list
npx wrangler r2 bucket list
```

Look for these names:

```text
home-study
home-study-rough-work
home-study-rough-work-preview
```

Follow the matching path below.

### If none of them exists

Run:

```bash
npx wrangler d1 create home-study
npx wrangler r2 bucket create home-study-rough-work
npx wrangler r2 bucket create home-study-rough-work-preview
```

### If some already exist

Create only the missing resources. Do not create duplicate resources with slightly different names.

### If all three already exist

Do not recreate them. Continue to Step C2.

## Step C2: Put the D1 database ID in the project

When D1 is created, Cloudflare prints a line similar to:

```text
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

The database ID identifies the database but is not a password.

Open `wrangler.jsonc` and find:

```jsonc
"database_id": "REPLACE_WITH_D1_DATABASE_ID"
```

Replace only `REPLACE_WITH_D1_DATABASE_ID` with the real ID. Keep the quotation marks.

The result should look like:

```jsonc
"database_id": "the-id-printed-by-cloudflare"
```

### If the D1 database already existed and its ID is unknown

Run:

```bash
npx wrangler d1 info home-study
```

Use the displayed database ID.

## Step C3: Regenerate types and verify the project

Run:

```bash
npm run cf-typegen
npm run check
```

Expected result:

- formatting passes;
- lint passes;
- TypeScript passes;
- tests pass;
- the dry-run Worker build passes.

Do not deploy if `npm run check` fails. Fix the reported problem first.

## Step C4: Save the non-secret configuration to GitHub

Run:

```bash
git add wrangler.jsonc worker-configuration.d.ts
git commit -m "chore: connect production Cloudflare storage"
git push origin main
```

If Git reports that there is nothing to commit, confirm that the placeholder in `wrangler.jsonc` was actually replaced.

---

# Part D — Create the database tables

The database exists but is empty until its migration is applied.

## Step D1: Review the pending migration

Run:

```bash
npx wrangler d1 migrations list home-study --remote
```

The first deployment should show `0001_initial.sql` as not yet applied.

## Step D2: Apply it

Run:

```bash
npx wrangler d1 migrations apply home-study --remote
```

Confirm when Wrangler asks permission to continue.

Expected result: `0001_initial.sql` is marked as successfully applied.

### If Wrangler says the migration was already applied

That is safe. Do not apply it manually a second time; continue to Part E.

### If migration application fails

Do not deploy. Keep the complete error text and diagnose the failure first. Never delete the database merely to clear a migration error.

---

# Part E — Deploy the first prototype

## Step E1: Run the final local check

```bash
npm run check
```

Continue only if it passes.

## Step E2: Deploy

Run:

```bash
npm run deploy
```

Expected result: Wrangler uploads the Worker and prints a temporary address ending in `.workers.dev`.

Open that temporary address in a browser. The page should display:

```text
Home Study
A calm place to learn, practise, and improve.
```

Also open:

```text
https://the-temporary-address.workers.dev/api/health
```

The response should contain:

```json
{ "service": "home-study", "status": "ok", "version": "0.1.0" }
```

### If the page works but `/api/health` fails

Do not attach the custom domain yet. Check the deployment logs and run `npm run check` again.

### If deployment reports an authentication error

Repeat Part B and verify `npx wrangler whoami` before trying again.

---

# Part F — Attach `study.saneax.in`

After the temporary `.workers.dev` address works:

1. Open [dash.cloudflare.com](https://dash.cloudflare.com/).
2. Click **Workers & Pages**.
3. Click **home-study**.
4. Click **Settings**.
5. Open **Domains & Routes**.
6. Click **Add**, **Add route**, or **Add Custom Domain**.
7. Choose **Custom Domain** if Cloudflare offers multiple choices.
8. Enter exactly:

   ```text
   study.saneax.in
   ```

9. Confirm the change.
10. Let Cloudflare create the DNS record and HTTPS certificate.

Do not manually create a second DNS record for the same hostname.

## Step F2: Verify the public address

Open:

```text
https://study.saneax.in
```

Then open:

```text
https://study.saneax.in/api/health
```

Or run:

```bash
STUDY_BASE_URL=https://study.saneax.in npm run test:remote
```

Expected result: the landing page loads over HTTPS and the remote smoke test passes.

### If Cloudflare says the hostname already exists

Open **DNS → Records** for `saneax.in` and look for an existing `study` record. Do not delete it blindly. Determine what it currently serves before replacing it.

### If HTTPS is initially pending

Wait for Cloudflare to issue the certificate, refresh the page, and test again. Do not disable HTTPS verification.

---

# Part G — Optional GitHub deployment automation

The first prototype can be deployed entirely with Wrangler as described above. GitHub automation is optional and should be configured only after the manual deployment succeeds.

The repository contains a manual **Deploy** workflow. It does not run merely because code is pushed.

To enable it later:

1. Create a restricted Cloudflare API token.
2. Open the GitHub repository `Incorpify-LLC/home_study`.
3. Open **Settings → Environments**.
4. Create an environment named `production`.
5. Add these environment secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
6. Run the workflow from **Actions → Deploy → Run workflow**.

The API token must be entered directly into GitHub’s masked secret field. Never store it in a file or paste it into chat.

Recommended Cloudflare token permissions, restricted to the relevant account and `saneax.in` zone:

- Workers Scripts: Edit
- D1: Edit
- Workers R2 Storage: Edit
- Workers Routes: Edit
- DNS: Edit

Cloudflare may rename permissions over time. Select the least-privilege equivalents in the current interface.

---

# Part H — Configure family OTP access

1. In **Zero Trust → Access controls → Applications**, create a **Self-hosted and private** application for the complete `study.saneax.in` hostname. Leave the path empty.
2. Enable only **One-time PIN** and use instant authentication when offered.
3. Create one **Allow** policy using the **Emails** selector with only the approved family addresses, plus the evaluation demo address `private-address@example.test` (see `docs/DEMO_USER.md`). Do not use Everyone, an email-domain selector, or Bypass.
4. Pre-create matching active users in D1 and link each student through `parent_students`. Keep real family identities out of Git history and fixtures.
5. Configure `ACCESS_AUD` and `ACCESS_TEAM_DOMAIN` in the Worker. Never configure `ACCESS_TEST_MODE` in production.

The Worker maps the verified Access JWT email to D1. Receiving an OTP is not by itself an application role, and an email header supplied by the browser is not trusted.

## Features intentionally left disabled

- Public self-registration and native password login remain disabled.
- Diagnostic assessments and assignments remain disabled until reviewed learning content is ready.
- No progress email is sent yet.
- No child’s name or academic profile appears on the public landing page.
- Rough-work buckets remain private.
- No automatic production deployment occurs on a normal GitHub push.

Progress email will be enabled only after the report format, sender, recipient, and schedule are approved.

---

# Completion checklist

The Cloudflare foundation is complete only when all boxes can be checked:

- [x] `saneax.in` is Active in Cloudflare.
- [x] `npx wrangler whoami` shows the correct account.
- [x] D1 database `home-study` exists.
- [x] R2 bucket `home-study-rough-work` exists and is private.
- [x] R2 bucket `home-study-rough-work-preview` exists and is private.
- [x] `wrangler.jsonc` contains the real D1 database ID.
- [x] `npm run check` passes after connecting production resources.
- [x] All remote D1 migrations through `0004_parent_students.sql` are applied.
- [x] Exactly one parent and three linked student identities are provisioned privately in D1.
- [x] Cloudflare Access protects the hostname with email OTP.
- [x] The Worker deployment loads.
- [x] `https://study.saneax.in` loads over HTTPS.
- [x] `https://study.saneax.in/api/health` returns `status: ok`.
