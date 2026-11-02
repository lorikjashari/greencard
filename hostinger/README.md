# Deploying Aplikodv on Hostinger

This app needs a Node.js runtime (SSR, API routes, Stripe webhooks). Hostinger
supports it in two ways:

- **Managed Node.js hosting** — Business, Cloud Startup, Cloud Professional,
  Cloud Enterprise, Cloud Enterprise Plus. Recommended. Hostinger builds the app
  with Next.js standalone output for you.
- **VPS** — full control, manual Node + PM2 + Nginx setup. Use the files in this
  folder.

Node **20 or newer** is required. The repo is `lorikjashari/greencard`, branch
`main`, and builds with `npm run build`.

---

## Option A — Managed hosting from GitHub (recommended)

1. hPanel → **Websites → Add website → Node.js** (or **Web apps → Create**).
2. Connect **GitHub**, choose `lorikjashari/greencard`, branch `main`.
3. Framework: **Next.js** (auto-detected). Build command: `npm run build`.
   Start command: `npm start`. Node: **20+**. Root: repository root.
4. Add the environment variables from [`.env.production.example`](./.env.production.example)
   **before the first build** — `NEXT_PUBLIC_*` values are baked in at build time.
5. Deploy. When the build finishes, open the site and check:
   - `/api/health` → `"mode": "postgres"` and every check `ok: true`
   - `/admin/login` → staff sign-in works
6. Point your domain at the site and enable the free SSL certificate in hPanel.
7. Update the Stripe webhook endpoint URL to
   `https://YOUR-DOMAIN/api/payments/stripe/webhook` (Developers → Webhooks).

## Option B — Managed hosting from a ZIP

Managed hosting can also import an archive instead of GitHub:

```bash
./hostinger/make-zip.sh          # writes ../greencard-hostinger.zip
```

Upload that ZIP in the Node.js app setup, then follow steps 3–7 above. The ZIP
excludes `node_modules`, `.next`, `.git` and every `.env*` file, so no secrets
are included. Set environment variables in hPanel.

## Option C — VPS (Ubuntu 22.04/24.04)

```bash
sudo apt update && sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2

sudo mkdir -p /var/www/greencard && sudo chown "$USER":"$USER" /var/www/greencard
git clone https://github.com/lorikjashari/greencard.git /var/www/greencard
cd /var/www/greencard
cp hostinger/.env.production.example .env.production
# edit .env.production, then:
npm ci && npm run build
pm2 start hostinger/ecosystem.config.cjs
pm2 save && pm2 startup
```

Nginx: copy `hostinger/nginx.conf.example` to
`/etc/nginx/sites-available/greencard`, replace `YOUR-DOMAIN`, symlink into
`sites-enabled`, then:

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d YOUR-DOMAIN -d www.YOUR-DOMAIN
```

Next.js reads `.env.production` at build time and again when `next start`
boots, so the PM2 process picks up server-side values from that file.
`NEXT_PUBLIC_*` values are baked in during `npm run build`, so rebuild after
changing them. `hostinger/deploy.sh` sources the file before building and
reloading.

Redeploy: `./hostinger/deploy.sh`.

---

## Required environment variables

See [`.env.production.example`](./.env.production.example). Minimum for a
working production site:

| Variable | Notes |
| --- | --- |
| `APP_MODE` | `postgres` |
| `DATABASE_URL` | Neon pooled connection string |
| `DATABASE_URL_UNPOOLED` | Neon direct string (migrations/scripts) |
| `SESSION_SECRET` | 32+ random chars (`openssl rand -base64 48`) |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-DOMAIN` — build-time, no trailing slash |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `sq` |
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | verified sender, e.g. `Aplikodv <no-reply@YOUR-DOMAIN>` |
| `PAYMENT_PROVIDER` | `stripe` |
| `STRIPE_SECRET_KEY` | `sk_live_...` (or `sk_test_...` while testing) |
| `STRIPE_WEBHOOK_SECRET` | signing secret of the endpoint for this domain |

`EMAIL_ASSET_BASE_URL` is optional; email images use `NEXT_PUBLIC_APP_URL`
automatically, so they load from `https://YOUR-DOMAIN/brand/...`.

## Post-deploy checklist

- [ ] `/api/health` shows `mode: postgres` and all checks `ok: true`
- [ ] `/admin/login` works with the staff password
- [ ] Magic-link email arrives and its link points at the new domain
- [ ] Stripe webhook URL updated to the new domain (`checkout.session.completed`)
- [ ] Resend domain verified; `EMAIL_FROM` uses that domain
- [ ] `https://YOUR-DOMAIN/brand/email-logo.png` returns 200
- [ ] A live €1 card payment marks the order paid, then refund it in Stripe
- [ ] Neon backups/PITR enabled (Neon console)

## Notes

- Do **not** upload `.env.local` or any `.env` file. Secrets belong in hPanel or
  the server environment.
- Uploaded photos live in Neon (`app_blobs`), not on Hostinger disk — no
  persistent-storage concerns.
- The app talks to Neon over HTTPS, so no inbound database port is needed.
- If you change `NEXT_PUBLIC_APP_URL`, rebuild/redeploy: it is compiled into the
  client bundle and used for emailed links and Stripe return URLs.
