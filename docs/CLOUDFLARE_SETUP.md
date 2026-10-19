# Put Home Study on Cloudflare — Beginner Guide

You do **not** need to understand servers, databases, DNS, or command lines to begin. This guide separates what **you must click** from what **I can finish after each step**.

Nothing is live yet. The deployment button is manual, so an ordinary code push cannot accidentally publish the site.

## What we are creating

Cloudflare will hold three private pieces:

1. **Worker** — runs the website.
2. **D1 database** — stores accounts, questions, assignments, and progress.
3. **R2 buckets** — store photographs of rough work. These remain private.

The final address will be:

```text
https://study.saneax.in
```

## Before starting

You need:

- Access to the Cloudflare account that manages `saneax.in`.
- Access to the GitHub repository `Incorpify-LLC/home_study`.
- About 15–20 minutes.

**Safety rule:** Never send me a password, Cloudflare token, GitHub secret, one-time login code, or recovery code in chat. Secret entry should happen only in the relevant website’s masked field.

---

# Part A — Your first Cloudflare check

## Step 1: Sign in and find the domain

1. Open [dash.cloudflare.com](https://dash.cloudflare.com/).
2. Sign in.
3. On the first page, look for **saneax.in** in the list of websites/domains.
4. Click **saneax.in**.

### Stop here and tell me one of these

- **“I can see saneax.in and it says Active.”**
- **“I can see saneax.in, but it does not say Active.”**
- **“I cannot see saneax.in.”**

Do not change DNS yet. Do not create `study.saneax.in` manually.

---

# Part B — Connect this computer to Cloudflare

Do this only after Step 1 is confirmed.

## Step 2: Start the safe Cloudflare login

I can run the following command on pi09 for you:

```bash
cd ~/workspace/personal/family/home_study
npx wrangler login
```

Cloudflare will show a browser authorization page. **You** review the permissions and click **Allow**. No password or code needs to be pasted into chat.

After you say **“saneax.in is Active; start Cloudflare login”**, I can begin this step and continue after you approve the browser page.

---

# Part C — Create storage

After login is complete, I can create the resources from pi09. You do not need to type these commands yourself:

```bash
npx wrangler d1 create home-study
npx wrangler r2 bucket create home-study-rough-work
npx wrangler r2 bucket create home-study-rough-work-preview
```

What they mean:

- `home-study`: the application database.
- `home-study-rough-work`: private production images.
- `home-study-rough-work-preview`: private test images.

I will then:

1. Insert the new database ID into the project configuration.
2. Run all tests again.
3. Commit and push that safe, non-secret ID to GitHub.

**Do not enable public access or an `r2.dev` address for either R2 bucket.**

---

# Part D — First deployment

For the first prototype, the simplest path is for me to deploy from pi09 after Wrangler login. This avoids making you create API tokens and GitHub secrets before you have seen the application.

I will run:

```bash
npx wrangler d1 migrations apply home-study --remote
npm run deploy
```

This creates the database tables and publishes the Worker. I will verify the temporary Cloudflare address before saying it works.

Later, once the prototype is stable, we can connect GitHub Actions so approved changes deploy automatically. That is optional groundwork—not required for the first deployment.

---

# Part E — Give it the name study.saneax.in

After the Worker is deployed:

1. Open the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. In the left menu, click **Workers & Pages**.
3. Click the Worker named **home-study**.
4. Click **Settings**.
5. Find **Domains & Routes**.
6. Click **Add** or **Add Custom Domain**.
7. Enter exactly:

   ```text
   study.saneax.in
   ```

8. Confirm the change.

Cloudflare should create the required DNS entry and HTTPS certificate. Do not point the hostname to a home IP or another server.

Tell me **“study.saneax.in has been added”**. I will then verify:

- The page opens over HTTPS.
- `/api/health` returns the expected response.
- No deployment or certificate error is present.

---

# Part F — GitHub automatic deployment (later)

This is not needed for the first prototype. When we enable it, I will guide you one screen at a time.

At that stage, you will create a restricted Cloudflare API token and enter it directly into GitHub under:

```text
Repository → Settings → Environments → production
```

The secret names will be:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Do not create these yet unless I specifically ask during that stage. The GitHub deployment workflow currently runs only when manually started.

---

# Part G — Email and student login

These are deliberately disabled for now.

- No progress email will be sent until you approve the report design and recipient.
- No student password has been created.
- No child’s personal details are present on the public landing page.
- Rough-work storage will remain private.

We will build authentication as the next tested product slice after the first deployment works.

---

# Where you are now

Start with only this:

1. Open [dash.cloudflare.com](https://dash.cloudflare.com/).
2. Find `saneax.in`.
3. Tell me whether its status is **Active**.

I will handle the next technical step after that confirmation.
