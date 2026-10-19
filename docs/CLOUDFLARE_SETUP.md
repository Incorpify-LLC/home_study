# Cloudflare Setup — Owner Checklist

The repository is prepared for Cloudflare, but deployment is intentionally blocked by a placeholder D1 ID until you create the resources below.

## 1. Confirm the zone

In the Cloudflare dashboard, confirm that `saneax.in` is an active zone in the account that will host the Worker. Do not manually create `study.saneax.in` yet; Wrangler can attach the custom domain after the first deployment, or it can be added from **Workers & Pages → home-study → Settings → Domains & Routes**.

## 2. Create an API token

Create a dedicated token for GitHub Actions rather than using the Global API Key.

Recommended scope, limited to the `saneax.in` zone and the owning account:

- Account → Workers Scripts → Edit
- Account → D1 → Edit
- Account → Workers R2 Storage → Edit
- Zone → Workers Routes → Edit
- Zone → DNS → Edit

Cloudflare may rename permissions over time; choose the least-privilege equivalents shown in the current token UI. Do not paste the token into chat or commit it.

Record the Cloudflare **Account ID** from the dashboard. It is not a password, but keep configuration centralized.

## 3. Create D1 and R2 resources locally

After authenticating Wrangler on your own terminal (`npx wrangler login`), run from the repository:

```bash
npx wrangler d1 create home-study
npx wrangler r2 bucket create home-study-rough-work
npx wrangler r2 bucket create home-study-rough-work-preview
```

The D1 command prints a `database_id`. Replace only this placeholder in `wrangler.jsonc`:

```text
REPLACE_WITH_D1_DATABASE_ID
```

Commit that non-secret D1 identifier through a pull request.

Do **not** make either R2 bucket public and do not attach an `r2.dev` domain. The application Worker will mediate access.

## 4. Add GitHub production secrets

In `Incorpify-LLC/home_study` open:

**Settings → Environments → New environment → `production`**

Add environment secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

If available on the GitHub plan, add a required reviewer to the `production` environment while the prototype is sensitive to schema changes.

Do not put these values in repository variables, workflow YAML, `.env`, `.dev.vars`, an issue, or chat.

## 5. Apply schema and deploy once

The deployment workflow will do this after the D1 ID is committed. For a controlled first deployment, use **Actions → Deploy → Run workflow**.

Its order is:

1. Install exact dependencies with `npm ci`.
2. Run formatting, lint, type, integration tests, and dry-run build.
3. Apply remote D1 migrations.
4. Deploy the Worker and static assets.
5. Verify `https://study.saneax.in/api/health`.

If you want to validate manually before enabling GitHub deployment:

```bash
npm ci
npm run check
npx wrangler d1 migrations apply home-study --remote
npm run deploy
```

## 6. Attach `study.saneax.in`

After the Worker exists:

1. Open **Workers & Pages → home-study → Settings → Domains & Routes**.
2. Add **Custom Domain**.
3. Enter `study.saneax.in`.
4. Let Cloudflare create/manage the DNS record and certificate.
5. Do not proxy the hostname to another origin.

Verify:

```bash
STUDY_BASE_URL=https://study.saneax.in npm run test:remote
```

Expected health body:

```json
{ "service": "home-study", "status": "ok", "version": "0.1.0" }
```

## 7. Keep email disabled for now

Do not configure automatic parent email yet. We will first build and approve the report preview. The eventual sender must use a verified address/domain, and the email binding/provider should be restricted to approved recipients, initially `private-address@example.test`.

## 8. Authentication decision for the next slice

Please decide whether all three children have stable email addresses they can use for Cloudflare Access OTP.

- If yes: we can test Access OTP for the whole application.
- If no: we will build native family credentials, with parent-controlled recovery, and can still protect the parent/admin path with Cloudflare Access.

No child password, email OTP, API token, or recovery code should be sent through chat.

## 9. Recommended GitHub settings

After the initial commit exists:

- Protect `main`.
- Require a pull request before merging.
- Require the `verify` CI job.
- Disallow force-push and branch deletion.
- Prefer squash merges.
- Keep the repository private.

This supports the agreed agile loop: small tested branch → pull request → green CI → deploy → family feedback → next slice.
