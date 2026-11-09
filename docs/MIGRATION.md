# Migration and rollback

## Preserved behavior

- React public and admin routes, including `/admin` and `#admin`.
- Existing form steps, round management, registration IDs, live Firestore listeners.
- Cloudinary image and PDF upload flow, preview and raw download behavior.
- Firebase email/password login and existing Firestore collection names.
- Scoring precedence, tie breaking, qualification/final views, CSV export.
- API paths, port 5000 default, and the evaluation response structure.
- Original stylesheet rules and their order; the minified CSS matches the baseline.

## Intentional changes

- Express is archived under `legacy/express-server`; Spring Boot is the active backend.
- AI evaluation now requires a trusted Firebase admin UID or signed `admin=true` claim.
  The old Express `verifyAdmin` accepted every valid Firebase user.
- CORS uses explicit frontend origins rather than allowing arbitrary origins.
- Server-side downloads are restricted to your configured Cloudinary image-upload
  path, with redirects disabled, rather than fetching arbitrary URLs.
- Criteria validation failures return 400. Provider failures use sanitized errors.
- Invalid criterion order/names from Gemini are rejected rather than assigning a
  score silently to a different criterion. Total scores are computed using decimals.
- Gemini models are explicitly configured (maximum three) instead of assuming
  that hard-coded model names are available to your account.
- The frontend build is in `frontend/dist`; Firebase Hosting configuration follows it.

## Existing security limitations outside this conversion

The original `firestore.rules` is preserved. It allows every authenticated user to
perform admin-like database operations. The new Spring Boot admin restriction
protects AI evaluation only; it does not change Firestore authorization or make the
entire admin interface secure. Review and test Firestore rules separately before
public deployment. Public submissions and unsigned Cloudinary uploads also retain
the original abuse-control limitations.

JWT verification checks Firebase signatures, issuer, audience, and timestamps.
It does not query Firebase for token revocation or disabled-user status. Existing
ID tokens may remain accepted until expiry. This backend is not a complete
production security audit; add appropriate traffic/rate controls at deployment.

## Safe switch checklist

1. Keep the original project and record the original deployment configuration.
2. Use staging credentials and test the new project locally.
3. Verify public page, round toggles, login/logout, submissions, PDF previews,
   downloads, manual scoring, AI scoring, qualification, final results, and CSV export.
4. Confirm ordinary users cannot call the Java AI endpoint.
5. Deploy the Java backend separately and test its HTTPS endpoint.
6. Build React with the new backend URL and configure the exact allowed origin.
7. Switch frontend hosting only after the staging checks pass.

Do not deploy the Firestore rules accidentally as part of a frontend-only switch.
Use your normal reviewed deployment process. No deployment has been performed here.

## Rollback

The original source is available at commit
`268d5a781d08f1be1e219221d6a07716d134598e` in the original repository. The ZIP also
includes `legacy/express-server` for API behavior comparison; its old private
service-account credentials and `.env` are deliberately not included.

To roll back a deployment, restore your previous frontend build/configuration and
start the original Express service with its existing private configuration. No
schema migration or data rewrite is required by this conversion. The old Express
security limitations return when using that service.
