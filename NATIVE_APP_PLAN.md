# Nesos Native App Plan

Ship Nesos (Next.js 16 app at nesos.co) to the App Store for Mac, iPad, and iPhone.

## Product decisions

- Users mostly use Nesos on desktop. The app is for that, plus quick capture while away from the computer.
- **Mac and iPad**: show the existing DESKTOP planner from nesos.co in a native window (WKWebView). Never show the current mobile layout. `useIsMobile` flips to mobile under 900px, so add an override (cookie or query flag set only by the native app) that forces desktop layout. Web users are unaffected.
- **iPhone**: do NOT load the website. Build a small native SwiftUI app with only:
  1. Today: today's tasks with check-off
  2. Quick add Task (text, optional day, defaults to today)
  3. Quick add Note
  4. Quick add Project (a project is a Client in this codebase: name + color)
  Plus sign-in and sign-out, and a settings screen with account deletion and the privacy page link. Nothing else. Clean, calm, matches the Nesos colors and the island feel, but minimal.
- **Mac and iPad also get the native quick-add sheet** from a menu bar item and keyboard shortcuts (Cmd+N task, Cmd+Shift+N note), so the app is more than a website wrapper (App Store Guideline 4.2).

## Architecture

- One SwiftUI multiplatform Xcode project in `/apple`, bundle id `co.nesos.app`. Native macOS target, not Catalyst, unless there's a strong reason.
- Keep the existing Supabase project and schema. No data migration. The native app never touches Supabase directly; it calls the existing `/api/db` routes (tasks, notes, clients, client-tasks). Mirror the field mapping those routes use (`week_id`, `day_index`, `user_email`, etc.) and reuse `lib/dates.ts` logic for `weekId` so tasks land in the right week.
- Routes auth via the NextAuth session cookie (`getToken`) for web, and `Authorization: Bearer` token for native. Both paths handled by the shared `getEmail()` in `lib/api-auth.ts`.

## Auth approach (agreed)

### Sign-in flow

1. Native app opens `ASWebAuthenticationSession` (callback scheme `nesos`) to `https://nesos.co/api/auth/mobile-start?provider=google` (or `apple`). That route calls Auth.js `signIn()` server-side with `redirectTo: /api/auth/mobile-callback`
2. User completes OAuth in a system browser sheet (not WKWebView — satisfies Google's policy)
3. After NextAuth completes sign-in, the app navigates to `/api/auth/mobile-callback` which:
   - Reads the now-valid session
   - Mints a **90-day HS256-signed bearer JWT** containing `{ email, name, image, iat, exp }`
   - Mints a **60-second one-time session token** (random hex, stored in `mobile_session_tokens` with the full Auth.js token payload, so the webview session keeps the Google access token for calendar)
   - Redirects to `nesos://auth-callback?token=<bearer>&session_token=<one-time>`
4. Native app receives both tokens via the custom URL scheme
5. Bearer token is stored in Keychain for native API calls
6. For **Mac/iPad WKWebView**: the app loads `/api/auth/mobile-session?token=<one-time>&desktop=1` which:
   - Verifies and deletes the one-time token (single use, 60s expiry)
   - Mints a proper Auth.js encrypted session cookie using `encode()` from `@auth/core/jwt`
   - Sets the session cookie, plus the `nesos-desktop=1` cookie when `desktop=1`, and redirects to `/`. The planner loads authenticated, in desktop layout

### Token refresh

The 90-day bearer JWT is long-lived. When the native app gets a 401, it re-triggers the `ASWebAuthenticationSession` flow (seamless since the user already has an active Google/Apple session).

### Sign in with Apple

Added as a NextAuth provider. Apple private relay email tradeoff:
- If a user signs in with Google as `user@gmail.com` and later with Apple using a private relay address, they get **two separate accounts**
- Recommendation: on the Apple sign-in screen, suggest "Share My Email" if they also use Google sign-in
- If Apple provides the real email (user chose to share), we use that (`profile.email` in the JWT callback)
- Users who only use Apple sign-in work fine with the relay address
- Account linking can be added later if needed

### Token revocation on account deletion

When an account is deleted via `/api/account/delete`:
1. Insert into `token_revocations` table with `user_email` and `revoked_at` timestamp
2. Clean up any pending `mobile_session_tokens`
3. Bearer token verification in `lib/api-auth.ts` checks: if `iat <= revoked_at`, reject the token

## Build order

### Step 1: API — bearer token support + mobile sign-in handoff + Apple provider [DONE]

**Committed**: `9950856` on `native-app` branch, follow-up fixes in the step 2 commit:
- New `app/api/auth/mobile-start/route.ts` (server-side `signIn()` entry point for the native app)
- `mobile-callback` stores the full Auth.js token payload with the one-time token; `mobile-session` re-encodes it (keeps calendar access in the webview) and uses `NextResponse` cookies
- `/api/account/delete` now uses `getEmail(req)` so the native app can delete accounts with its bearer token, and uses the server Supabase client so deletes are not blocked by RLS
- `lib/auth.ts`: OAuth check cookies (pkce, state, nonce) use `SameSite=None` in production, needed for Apple's cross-site form POST callback
- `jose` added as a direct dependency

New files:
- `lib/api-auth.ts` — shared `getEmail()` with bearer + cookie support + revocation check
- `app/api/auth/mobile-callback/route.ts` — mints bearer + one-time token, redirects to `nesos://`
- `app/api/auth/mobile-session/route.ts` — consumes one-time token, sets Auth.js session cookie

Modified files:
- `lib/auth.ts` — added Apple provider with real-email preference
- `app/api/account/delete/route.ts` — revokes tokens + cleans up session tokens
- All 10 `app/api/db/*/route.ts` — replaced local `getEmail` with shared import

### Step 2: Desktop layout override on the web [DONE]

`hooks/useIsMobile.ts` skips the width check when the `nesos-desktop=1` cookie is present. `/api/auth/mobile-session?desktop=1` sets it (1 year). Web users never get this cookie. The desktop planner has no Tailwind breakpoints, so iPad portrait keeps the desktop layout.

Original notes:

- Modify `hooks/useIsMobile.ts` to check for a `nesos-desktop` cookie (or similar flag)
- When the cookie is present, `useIsMobile()` always returns `false`
- The native Mac/iPad app sets this cookie when loading the WKWebView
- Web users are completely unaffected

### Step 3: iPhone native app (SwiftUI) [WRITTEN, needs first Xcode build]

Code lives in `apple/Nesos/Nesos/`. Xcode project: `apple/Nesos/Nesos.xcodeproj` (new Xcode 27 text format, folder-synced, so new .swift files are picked up automatically). Bundle id `co.nesos.app`, iOS 17+ / macOS 14+, iPhone + iPad + Mac in one target. Base URL `https://www.nesos.co` (Config.swift). If the week is empty, the app copies recurring tasks in first, like the web does.

Original notes:

- Sign-in screen (Google + Apple via `ASWebAuthenticationSession`)
- Today view: fetch tasks for current `weekId` + today's `dayIndex`, show with check-off
- Quick add Task: text field, optional day picker (defaults to today), POST to `/api/db/tasks`
- Quick add Note: text field, POST to `/api/db/notes`
- Quick add Project: name + color picker, POST to `/api/db/clients`
- Settings: sign out, delete account (calls `/api/account/delete`), privacy page link
- Keychain storage for bearer token
- `weekId` calculation must match `lib/dates.ts` (ISO week, Asia/Bangkok timezone)

### Step 4: Mac and iPad webview shell + native quick-add [WRITTEN, needs first Xcode build]

`DesktopPlannerView.swift`. If the planner tries to start Google/Apple sign-in inside the web view, the app cancels it and signs in natively instead. Mac: toolbar + menu, File menu shortcuts, MenuBarExtra, Settings window (Cmd+,). iPad: floating + button.

Original notes:

- WKWebView loading `nesos.co` with `nesos-desktop` cookie
- Session injection via `/api/auth/mobile-session`
- Native quick-add sheet (shared SwiftUI code with iPhone)
- Mac menu bar item with quick-add
- Keyboard shortcuts: Cmd+N (new task), Cmd+Shift+N (new note)
- iPad: same webview + quick-add sheet

### Step 5: App Store readiness

- App icon from `public/nesos-icon.webp` for all required sizes
- `Info.plist` strings (app name, description, URL scheme `nesos://`)
- `PrivacyInfo.xcprivacy` manifest
- Account deletion reachable from settings (Guideline 5.1.1)
- Review notes with a demo login
- Screenshot list per device:
  - iPhone 6.7" (iPhone 15 Pro Max)
  - iPhone 6.1" (iPhone 15 Pro)
  - iPad Pro 12.9" (6th gen)
  - Mac (screenshot)

## Supabase tables to create

```sql
-- One-time tokens for WKWebView session injection
create table mobile_session_tokens (
  token text primary key,
  user_email text not null,
  payload jsonb,
  expires_at timestamptz not null
);

-- If you already created it without payload:
-- alter table mobile_session_tokens add column payload jsonb;

-- Token revocation on account deletion
create table token_revocations (
  user_email text primary key,
  revoked_at timestamptz not null
);
```

## Environment variables

| Variable | Where to set | Notes |
|----------|-------------|-------|
| `APPLE_CLIENT_ID` | `.env.local` + Vercel env vars | Apple Services ID, e.g. `co.nesos.auth`. Created in Apple Developer > Identifiers > Services IDs |
| `APPLE_CLIENT_SECRET` | `.env.local` + Vercel env vars | A signed JWT you generate from your Apple private key. Must be regenerated every 6 months. |
| `AUTH_SECRET` | Already set | Used to sign bearer tokens and Auth.js session JWTs. No change needed. |
| `GOOGLE_CLIENT_ID` | Already set | No change needed. |
| `GOOGLE_CLIENT_SECRET` | Already set | No change needed. |

## Apple Developer Console setup

1. **App ID**: Register a new App ID with bundle identifier `co.nesos.app`
   - Enable **Sign in with Apple** capability
2. **Services ID** (for web/NextAuth Apple sign-in):
   - Create a new Services ID (e.g. `co.nesos.auth`) — this becomes `APPLE_CLIENT_ID`
   - Enable **Sign in with Apple**
   - Configure **Domains and Subdomains**: `nesos.co`
   - Configure **Return URLs**: `https://nesos.co/api/auth/callback/apple`
3. **Key**:
   - Create a new key with **Sign in with Apple** enabled
   - Download the `.p8` private key file (you only get one download)
   - Note the **Key ID**
4. **Generate `APPLE_CLIENT_SECRET`**:
   - This is a JWT signed with the `.p8` key, containing your Team ID, Key ID, and Client ID
   - Use a tool like `apple-auth` npm package or sign manually:
     ```js
     const jwt = require("jsonwebtoken");
     const fs = require("fs");
     const privateKey = fs.readFileSync("AuthKey_XXXXXXXXXX.p8");
     const secret = jwt.sign({}, privateKey, {
       algorithm: "ES256",
       expiresIn: "180d",
       audience: "https://appleid.apple.com",
       issuer: "YOUR_TEAM_ID",
       subject: "co.nesos.auth",
       keyid: "YOUR_KEY_ID",
     });
     ```
   - Set a calendar reminder to regenerate before it expires (max 6 months)
5. **Provisioning profiles**: Create development and distribution profiles for `co.nesos.app` covering iOS and macOS

## Google Cloud Console setup

- **No changes needed** for existing OAuth credentials
- The native app uses `ASWebAuthenticationSession` which opens a real system browser, so Google allows it (no embedded webview restriction)
- Optionally add `nesos://auth-callback` as an authorized redirect URI if Google requires it during the `ASWebAuthenticationSession` flow (unlikely since the redirect goes through your NextAuth callback first)

## Rules

- Do not commit secrets (`.env.local` is gitignored)
- Every env var and console setting that must be configured by hand is listed above
- Read `node_modules/next/dist/docs/` before touching any Next.js code — this is Next.js 16 with breaking changes
