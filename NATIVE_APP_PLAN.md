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

### Step 3: iPhone native app (SwiftUI) [REBUILT to the storyboard, builds pass]

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

### Step 4: Mac and iPad webview shell + native quick-add [BUILDS PASS]

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

## iPhone design: locked in (Nov 18, 2026)

Storyboard: https://claude.ai/artifact/NWtn72Fht9uFjUH7vJR8g5 (Nesos iPhone Storyboard). Built from the live desktop planner. Paige's real workflow is projects (the `clients` / `client_tasks` tables) with due dates, not weekly tasks, so the iPhone app is rebuilt around projects. The earlier weekly "Today" iPhone screens in `apple/` get replaced.

Style (match the website, never substitute): Playfair Display, Inter, Aboreto bundled in the app; pastel grid "board" background; 7px corners; white spaced caps (600 weight, 0.2em tracking) on solid color tiles; a see-through white band (22%) across the bottom of tiles for counts and plus icons.

Home:
- Header: N mark, NESOS wordmark, "νῆσος · nê·sos", round profile button. Sits high, just under the status bar.
- Row of three tiles: Overdue, Today, This Week (blues #7f9fd6, #6fb0c8, #6a95a8), count + plus in the band.
- PROJECTS heading, then a 2-column grid of project tiles (84px tall, project color, name on top, "N TASKS" + plus in the band). Shows 8 tiles, scrolls for the rest, with a permanent thin scroll bar (custom on iOS) and a light bottom fade. The grid runs down to 3px above the bottom row so tiles tuck under it.
- Bottom row: quote card (wide) + date tile (136px, #8fb0ec) aligned with the tile columns.
- No Capture button. Adding happens from plus buttons.

Inside a project:
- Same header with a round back button.
- Full-width project tile: name, Timer pill, band "N TASKS · N OVERDUE".
- TASKS heading with "ADD +" on the right.
- Task rows: soft white rounded rows, project-color due chip, task text, check circle; done tasks fade. Scrolls with the same bar and fade.
- Notes: full-width card under the list. Files: slim solid project-color bar below it ("FILES", "ATTACH +").

Adding a task (inline, no separate screen):
- Tapping ADD turns it into CLOSE ×, the add card opens under the TASKS heading and the list slides down.
- Card: NEW TASK text line, DUE quick picks on one line (Today, Tomorrow, Pick date, None), full-width "ADD TO <PROJECT> +" button in the project color.
- After adding, the card closes and the task appears in the list.

Still to restyle: Due lists screen, Sign in screen.

## iPhone app: built to the storyboard (Nov 18, 2026)

Status: both builds pass (iOS Simulator and Mac). Next is a test on Paige's phone in guest mode.

### What the phone app is now

- Project based, not week based. Home shows Overdue, Today and This Week tiles, a 2-column grid of project tiles, the quote of the day and a date tile.
- Due page: Overdue, Today and This Week on one page. One section is open at a time and keeps its color. Tapping a home tile opens that section.
- Project page: header tile (timer, pencil to edit name and color), tasks, notes, files bar, and a frosted archive button.
- Add and edit happen inline: the card opens under the TASKS or PROJECTS header and the list drops down. Tapping a task opens the same card with Save and Delete.
- Archive is per project: search, grouped by month, restore.
- Profile: theme (Pastel, Neutral, Custom color), privacy link, sign out, delete account.
- Fonts are hers and bundled in the app: Playfair Display, Inter, Aboreto. The N in the logo stays #b9c8de. Logo treatment is parked.

### Decisions

- Theme syncs to the account (`user_settings` table, `/api/db/settings`).
- Archived projects sync to the account (`clients.archived`).
- Today and This Week use the person's own time zone on the phone. Timer sessions are still logged in Bangkok time to match the website.
- iPad and Mac keep the desktop planner, with New Task and New Project quick add.
- Finished tasks move to the archive after 24 hours, same as the website.

### Added during phone testing (Nov 18, 2026)

- Dark board: a dark custom background flips the phone app to light text. The switch point is `AppStore.darkBoardBelow`.
- Timer: TIMER opens the block with START and LOG. While running: STOP and LOG. After STOP: SAVE or DELETE.
- Timer log: a page per project listing saved sessions. Tap a session to name it, ✕ to delete it. Uses `GET /api/db/sessions?clientId=`.
- Your color: picked in the profile (six presets or custom). It colors the profile tile, the date tile and the quote bar, and Overdue, Today and This Week become shades of it. Sky (#8fb0ec) is the default and gives the original colors. Saved as `user_settings.personal_color`.

### Logo, icon and home banner (Nov 18, 2026)

- Her real N is the tapered Aboreto N from `public/nesos-icon.webp`. The app draws it as a shape (`NMark` in `Components.swift`). The serif stand-in is gone.
- One ink: the N is Nesos blue on light boards and pale on dark ones.
- Where the logo shows: the N on the home banner only. NESOS spelled out in Aboreto (spacing -0.04) on the profile page only. Other pages carry no logo. The Greek line is dropped.
- Home banner: a tile at the top of home in the person's own color at 70%, with the N, a centered greeting and the profile button. The greeting follows the time of day and uses the account's first name (guests get no name).
- App icon: "Deep water". Nesos blue, a soft grid five squares across, and the yellow to mint N. Made by `apple/make_icon.py`, which writes the iPhone and Mac sizes into the asset catalog. Dark and tinted iPhone variants are not made yet.
- Sign-in page: her N above NESOS spelled out in Aboreto, both in the sign-in blue, then the tagline.

### Guest mode (temporary, for testing)

- "Continue as guest" on the sign-in screen (iPhone and iPad). Data is saved on the device only, in `nesos-guest.json`.
- To remove: delete the guest button in `SignInView.swift`. `LocalBackend` in `Backend.swift` and `isGuest` in `AuthStore.swift` can go with it.

### Still to do

- Supabase: add `clients.archived` and create `user_settings` (SQL below), then deploy the `native-app` branch so sign-in works.
- Phone: "Today" total on the running timer, a real "How Nesos works" page, which sign-in was used on the profile tile.
- Website: the readable-text switch for custom background colors exists only in the phone app. On the website a dark or mid-tone custom color (seen with a brown-orange, Nov 18) leaves the logo, Greek line, top icons, calendar labels and the "Nothing overdue" text hard to read. Bring the same rule to the website (`hooks/useAppearance.ts` and the board styles). Mid-tones like that brown sit right at the phone's switch point (`AppStore.darkBoardBelow`, 0.5), so test it there too and consider raising it.

```sql
alter table clients add column if not exists archived boolean not null default false;

create table if not exists user_settings (
  user_email text primary key,
  theme text,
  custom_color text,
  static_background boolean,
  personal_color text,
  display_name text,
  updated_at timestamptz
);
alter table user_settings enable row level security;
```

### How to build

Double-click `apple/build.command`. It builds for iPhone and Mac and writes `apple/build.log`.

- Security, before the App Store: close anon access to the planner tables (see chat of Nov 18).

## Closing the open access to the tables (DONE Nov 19, 2026)

Result: merged to main as pull request #6, closing SQL run, check passed on all 11 tables (public cannot read or write, row security on, server can read, 0 open rules left, file storage rules included).

Do not re-run the old saved Supabase query "Grant Anon Full Access". It would reopen everything.

Why: the planner tables were reachable with the site's public key (anon role, row security off). The website's browser code fell back to that route whenever the server route failed.

Done so far (committed on `native-app`, not pushed):
- The five files in `lib/storage/supabase/` no longer touch the tables from the browser. They call the server routes through `lib/storage/supabase/api.ts`, which retries once.
- Nothing else in the website uses the browser database client.
- The server role was granted access to every table on Nov 18.

Steps for Paige, in order:
1. Supabase: run `supabase-sql/1-look-first.sql` and send a screenshot. Claude checks for anything unexpected, especially the file storage rules.
2. Publish: `git push`, then merge the pull request. Wait for Vercel to say Ready.
3. Use nesos.co for a minute: open a project, add a task, check one off, add a note. Confirm it all saves and survives a reload.
4. Supabase: run `supabase-sql/2-close-the-door.sql`.
5. Supabase: run `supabase-sql/3-check-it-is-closed.sql`. Every row should say false, false, true, true.
6. Reload nesos.co and open the phone app. Both should still load and save.

If the website stops loading data after step 4: run `supabase-sql/undo-reopen.sql`, then tell Claude.

What the look-first check showed (Nov 19):
- Row security was already on for every table, but each planner table had an `anon_all` rule that let the public key do everything. So the tables were open in practice.
- The "Client files" bucket is private, but four `allow_all` rules on `storage.objects` let the public key read, upload, change and delete files.
- The website only touches files through the server key and signed links (`app/api/db/files/*`), so those four rules are not needed. The closing SQL removes them too.

## Waiting for the next app update (as of Nov 19, 2026)

- **Planner zoom on Mac and iPad.** View menu: Zoom In (Cmd +), Zoom Out (Cmd -), Actual Size (Cmd 0). Steps 75, 90, 100, 110, 125, 150, 175, 200 percent. Remembered on the device (`nesos-planner-zoom`). Code is in `DesktopPlannerView.swift` (`PlannerZoom`) and `NesosApp.swift`.
  - NOT BUILT OR TESTED YET. Send the boat before the next upload and check the build log.
  - Starts at 100 percent for everyone. Paige's Chrome default is 125 percent, which is why the app looked smaller to her. Open question: start bigger for everyone?
- Mac TestFlight build 1.0 (1) is live for the internal group "me". It does not have zoom.

## Mac upload notes (learned Nov 19, 2026)

- Mac uploads need a "Mac Installer Distribution" certificate (shows in Keychain as "3rd Party Mac Developer Installer"). Made on developer.apple.com from a request file created in Keychain Access, after Xcode and the website both errored for a few hours. Expires Nov 19, 2027.
- The macOS platform was added to the Nesos app record in App Store Connect.
- Each app has its own TestFlight tester list. Making a group does not add anyone to it.
- TestFlight on a Mac uses the Mac App Store's Apple ID. It has no sign-in of its own.
