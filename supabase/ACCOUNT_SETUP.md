# SIASET account profiles

## Signup/sign-in retry fix

The former ten-minute pending-email lease blocked subsequent signup/recovery requests before they reached Supabase. Explicit new requests now supersede that lease inside the existing cross-tab Web Lock; the UI explains that the newest email link replaces earlier requests. Callback exchanges use the same lock, validate lease shape/age/type, and still require verified PKCE identity. Successful direct sign-in clears pending state. No email-confirmation or authentication protections were disabled.

Unconfirmed email sign-in now explains the confirmation requirement and offers Resend confirmation and Use a different email. Invalid credentials, connection failures, weak passwords and server rate limits receive specific safe messages. Duplicate in-flight form submissions are suppressed.

Validation: build and focused lint passed; 11 auth/profile checks passed, including retry replacement, failed-request cleanup, malformed leases and callback coordination. A browser sign-in with a synthetic nonexistent address reached Supabase and displayed the expected invalid-credentials message; test fields were cleared afterward. No real signup email was sent by the agent. Actual successful signup/confirmation/sign-in needs the user's account retry. Preview remains running at `http://localhost:5173/account`.

Implemented 4 November 2026 against the existing **siaset-staging** project, `vtbwzyyovfarfytbvoun` (eu-central-1). No new project, deployment, dependency, paid integration or learner-evidence sync was created.

## What is connected

- The local frontend uses the staging URL and modern publishable key from an ignored `frontend/.env.local`. Privileged keys remain rejected by the original client configuration.
- Email/password signup, sign-in, recovery and local sign-out use Supabase Auth. The existing PKCE callback, single-flow lease, same-browser verification and safe destinations remain in place.
- Names and built-in avatar IDs are stored in Auth user metadata, exclusively for display. Metadata is never used for authorization.
- The former sidebar course card now links to account settings and shows the signed-in user's name, email and avatar. Guests see a sign-in invitation; no account is inferred before a verified session.
- Eight bundled vector avatars can be selected during signup or edited afterward.
- Signed-in users can choose a PNG/JPEG/WebP image up to 5 MB. The browser prepares a centered 256×256 WebP, removing the original image metadata. Upload happens only on Save profile.
- Photos are stored under `<authenticated-user-id>/<random-id>.webp` in the private `profile-avatars` bucket. The bucket only accepts WebP up to 256 KiB. Owner-scoped read/insert/delete policies exclude anonymous Auth users. There is no public bucket or public image URL. The browser downloads through the authenticated Storage API and revokes local object URLs when replaced/unmounted.
- Upload paths are immutable (`upsert:false`), so no Storage UPDATE policy is needed. Prior photos are removed after the new profile is saved; cleanup failures do not falsely report a successful save as failed.
- Preset choices and photo edits are drafts until Save profile. Photo upload is offered after sign-in, not before email verification.

`20261104161232_profile_avatars.sql` was generated with the installed CLI and applied to the connected staging project through the Supabase connector. Existing learning tables, functions, evidence, RLS and contracts were not modified. `README.md` describes the earlier DB-2 foundation boundary; the account-specific changes above supersede its statement that no frontend project is configured.

## Google sign-in — configuration still required

The staging public Auth settings report email enabled, signup enabled, confirmation emails required, and **Google disabled**. The frontend detects this and disables its Google action with a truthful explanation.

To enable Google:

1. Choose the user's Google Cloud project and create a **Web application** OAuth client. Configure its consent screen and test users if using testing mode.
2. Add the exact frontend origin, currently `http://localhost:5173`, to the OAuth client's authorized JavaScript origins. Add the eventual production origin separately when known.
3. Add this authorized redirect URI in Google Cloud:
   `https://vtbwzyyovfarfytbvoun.supabase.co/auth/v1/callback`
4. Enter the Google client ID and client secret directly into the Google provider settings for **siaset-staging**, then enable the provider. Never place the secret in chat, source code, Vite environment variables or this report.
5. In hosted Supabase Auth URL configuration, allow the exact app callback and recovery URLs:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/auth/recovery`
   - If using 127.0.0.1, add its two corresponding URLs too. Add exact production URLs once the domain is known; do not use wildcard redirects for production.
6. Confirm email delivery/SMTP for the intended users before public signup rollout. Hosted redirect allowlists and SMTP configuration were not exposed by the available connector and were not changed or claimed verified.

Google Cloud ownership, OAuth credentials and final site domain have not been supplied, so the provider remains disabled. The app's existing Google PKCE integration is ready for the configured provider.

References: [Supabase Google setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [Auth profile metadata](https://supabase.com/docs/reference/javascript/auth-updateuser), [Storage access controls](https://supabase.com/docs/guides/storage/security/access-control).

## Verification and limits

- Production build and focused JSX lint passed.
- Eight focused auth/profile checks passed: client-key restrictions, callback/lease behavior, safe routes, owned image paths, type/size rejection, session-change refusal and upload-failure preservation.
- Browser: live Auth settings loaded; signup/sign-in modes, avatar choices and live artwork worked; Google correctly disabled; no horizontal overflow at the checked narrow width (325 CSS pixels under browser zoom).
- Staging database assertions confirmed own-folder reads/inserts and rejection of another owner's insert. Synthetic metadata rows were rolled back; bucket object count remained zero. A first test encountered Storage's direct-delete protection; it was replaced by supported read/insert assertions rather than bypassing that protection. SDK photo deletion was not tested against a real file.
- Security advisors reported only the existing informational `private.contract_manifests` RLS-without-policy finding; this is the existing service-only, deny-by-default contract table. [Advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- No real user was registered, emailed or signed in by the agent. Actual email delivery, confirmation redirects, signed-in profile save/photo upload and Google round-trip still require a user-owned account and provider setup. No claim of completed live end-to-end authentication is made.
- Learning stays browser-local. Signing in does not upload, import or associate historical learning evidence.
