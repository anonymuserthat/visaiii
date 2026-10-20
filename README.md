# ProVisa Desktop

Windows desktop booking assistant for the Capago Algeria flow, built with Tauri, React, TypeScript, Vite, Tailwind CSS, shadcn-style UI primitives, Zustand, TanStack Query, React Hook Form, and Zod.

## ProVisa branding and compatibility

The application is named **ProVisa**. The desktop product/window title, browser title, icon, package metadata, and new draft export filenames use this name. Existing `damander-visa-*` storage keys, the `eu.damander.visa` bundle identifier, and internal Rust binary/library names are intentionally retained so upgrades continue to find existing profiles, drafts, encrypted credentials, and request history. Do not rename those identifiers without an explicit data migration.

## What it does

- Provides a light ProVisa workspace with saved requests, search and seven functional sections.
- Organizes the booking flow into four compact stages with a focused form and on-demand review.
- Supports both `capago_ANB` and `capago_CZL` from the same booking base path.
- Loads centers, services, visa types, availability, and slots dynamically per selected center.
- Solves reCAPTCHA v2 automatically through 2Captcha when a valid booking is submitted, then posts the booking with the returned token.
- Connects Gmail through your Google OAuth Desktop app and displays a searchable, read-only inbox.
- Stores cookies and real HTTP session handling in the Tauri backend.
- Saves local drafts, exports/imports JSON drafts, and writes an audit log.
- Includes mock fixtures so the app is usable without live captures for every edge case.

## UI redesign and verification

See [the redesign handoff](docs/ui/README.md) for actual running screenshots, coverage, audit instructions and the remaining native verification limits.

## Runtime modes

### Mock mode

Uses local booking fixtures from [`public/fixtures`](./public/fixtures). Paid CAPTCHA solving is disabled. Gmail remains a separate, live connection when you explicitly connect it in the desktop app.

### Live mode

Uses the Tauri backend commands to call the remote booking endpoints with a persistent cookie jar.

## Environment

Create a `.env` file if you want to override the defaults:

```env
VITE_BOOKING_BASE_URL=https://visa-fr-dz.capago.eu/rendezvous_annaba
VITE_MOCK_MODE=true
VITE_DEFAULT_LOCALE=fr
TWOCAPTCHA_API_KEY=
SHARD_001_DATABASE_URL=postgresql://user:password@host.example/neondb?sslmode=require
SHARD_100_DATABASE_URL=postgresql://user:password@host.example/neondb?sslmode=require
DATABASE_URL=postgresql://user:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Default base URL already points to the shared Annaba route, with center switching driven by `area` / `capago_center_id`.
The Tauri backend reads `SHARD_001_DATABASE_URL` through `SHARD_100_DATABASE_URL` at runtime. Records are assigned deterministically to the configured shard pool, while history reads merge records from all configured shards. Keep these values in a local, uncommitted `.env`; they are never bundled into the frontend.

## Automatic CAPTCHA with 2Captcha

1. Use the Windows desktop app in live mode (`VITE_MOCK_MODE=false` when building or starting it).
2. Set `TWOCAPTCHA_API_KEY=your_key` in the root `.env` and restart the desktop app, or enter the key in booking step 4. Enable automatic solving and click **Enregistrer 2Captcha**; when using `.env`, leave the key field empty. Your 2Captcha account needs a positive balance.
3. Confirm the page URL, public site key, invisible setting, and Enterprise setting under **Parametres du site** match the current target CAPTCHA. The defaults are for the existing Annaba reCAPTCHA v2 page; provider changes may require updating them.
4. Submit a valid booking. The app creates one task, polls for the result for up to three minutes, and immediately posts the booking with the returned token. A solver error blocks the booking request and lets you retry.

Each solve uses your 2Captcha balance, including a solve followed by a rejected booking. Tokens expire quickly and are single-use. The site can still reject a solver token, including challenges requiring additional session or IP context. Solver tokens are never saved in booking drafts. Automatic solving is unavailable in the web preview and demonstration mode.

`TWOCAPTCHA_API_KEY` is read by Rust at runtime and is not bundled into the frontend or installer. For an installed app, put a `.env` beside the installed `damander_visa.exe` or set the Windows environment variable. A key saved through the app takes priority; **Reinitialiser 2Captcha** clears that override. Keys entered through the app are encrypted locally; a key written in `.env` stays in that file.

## Gmail with a new Google OAuth app

1. Create a project in [Google Cloud](https://console.cloud.google.com/) and enable **Gmail API**.
2. Configure **Google Auth Platform** branding, audience, and consent. For an external app in testing, add your Gmail address under test users and add the `https://www.googleapis.com/auth/gmail.readonly` scope under data access.
3. Create an OAuth client of type **Desktop app / Application de bureau** and download its JSON credentials. A Web application client is not compatible with this desktop loopback flow.
4. Open the software’s **Messagerie** page, import the JSON, click **Enregistrer l'application Google**, then **Se connecter avec Google**. Complete consent in your normal browser and return to the software. The local callback uses a temporary `127.0.0.1` port automatically.
5. Search or refresh the inbox, browse pages of 20 messages, and select a message to read it. Standard Gmail search operators such as `from:`, `subject:`, and `is:unread` are supported within the inbox.

Google's external testing mode usually expires refresh tokens after seven days for Gmail scopes, so reconnect when needed. Publishing an app for other users can require Google's verification for the Gmail read-only scope.

Google client credentials, Gmail tokens, and 2Captcha keys entered through the app are encrypted locally with Windows DPAPI for the current Windows user. Keys set in `.env` remain in that file. Gmail access is read-only: viewing a message does not mark it read. Email content is displayed as text, with no remote images or attachment downloads. **Deconnecter** removes the account's local tokens; **Oublier l'application et le compte** also removes the local OAuth configuration. To revoke Google's permission, remove the app from your [Google Account connections](https://myaccount.google.com/connections).

## Scripts

```bash
npm install
npm run dev         # Vite web dev server on port 1420
npm run dev:tauri   # Full desktop app
npm run test
npm run typecheck
npm run build
npm run build:tauri
```

## Verification used

```bash
npm run typecheck
npm test
npm test -- --maxWorkers=1 --pool=threads # For machines where default test workers time out
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --offline --manifest-path src-tauri/Cargo.toml --lib
```

## Project structure

```text
src/
  components/ui/                shadcn-style UI primitives
  features/booking/
    components/                 summary, stepper, success, errors
    hooks/                      bootstrap hook
    steps/                      step 1..4 screens
  features/dashboard/pages/     Gmail inbox and other dashboard pages
  lib/
    api/                        typed client, mappers, payload builders, query hooks
    audit/                      frontend audit helper
    persistence/                draft import/export + external opener
    gmail/                      typed Gmail bridge and safe text conversion
    recaptcha/                  manual verification and 2Captcha bridge
    state/                      Zustand slices and defaults
    validation/                 Zod validation rules
src-tauri/src/
  commands/                     HTTP, draft, audit, 2Captcha, Gmail OAuth, encrypted secrets
public/fixtures/                mock JSON responses
```

## Security notes

- The desktop backend uses a normal HTTP client with cookie persistence inside the Tauri process.
- Keys entered through the app and OAuth tokens use the Rust backend's encrypted storage; environment keys stay in their configured location. Credentials are not returned to the UI.
- Gmail authorization uses a state-validated local callback and PKCE, with read-only access.

## Build output

Tauri is configured for Windows `nsis` and `msi` bundles in [`src-tauri/tauri.conf.json`](./src-tauri/tauri.conf.json).

## Troubleshooting

### The app opens but live requests fail

- Run `npm run dev:tauri`, not just `npm run dev`, for real network mode.
- Check that `VITE_MOCK_MODE` is `false`.
- Confirm the remote endpoint still accepts the shared `/rendezvous_annaba` base path.

### Draft import/export fails in desktop mode

- Confirm the Tauri dialog and fs plugins are enabled.
- Check app permissions in [`src-tauri/capabilities/default.json`](./src-tauri/capabilities/default.json).

### Rust build is slow on first run

- First `cargo check` downloads and compiles the full Tauri stack.
- Subsequent builds are much faster because dependencies are cached.

### Chunk size warning during web build

- The current app builds successfully.
- Vite warns that the main JS chunk is above 500 kB; this can be optimized later with route or feature code-splitting.

## Windows multi-PC : notes de la version 0.2.0

Consultez [INSTALLATION_WINDOWS.md](./INSTALLATION_WINDOWS.md) avant de mettre a jour
ou de deployer l'application sur un autre ordinateur. Le secret `DATABASE_URL`
n'est plus integre a l'executable; il faut configurer la connexion dans
**Base de donnees partagee > Configurer** sur chaque ordinateur.
L'application conserve le cache local et affiche maintenant l'etat de la connexion.
Une demande de confirmation native apparait lorsque l'utilisateur ferme la fenetre.
