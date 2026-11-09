# Study the project one feature at a time

The original `App.jsx` held 5,919 lines. The new `App.jsx` is a small entry point;
feature code lives alongside other files for that feature. Existing screen labels,
form steps, data fields, collections, and CSS classes are preserved.

## Frontend map

| Location inside `frontend/src/` | What to study |
| --- | --- |
| `main.jsx` | Mounts React and loads styles once |
| `App.jsx` | Chooses the public site or admin view and selects the participant round |
| `hooks/useAppData.js` | Firebase round/auth subscriptions and their cleanup |
| `hooks/useReveal.js` | Scroll-reveal animation behavior |
| `config/firebase.js` | Initializes Firebase Auth and Firestore |
| `config/constants.js` | Default scoring criteria, departments, years, upload limits, API URL |
| `components/layout/` | Navbar and Footer |
| `components/common/` | Shared Field and SectionHead components |
| `features/public/` | PublicSite page, Hero, Challenge, Guidelines |
| `features/auth/pages/` | Existing Firebase email/password admin login |
| `features/admin/` | Dashboard page, sidebar, topbar, statistic cards |
| `features/rounds/` | RoundForm, RoundManagement, and default form values |
| `features/submissions/` | Participant form, file uploader, submissions table, preview modal |
| `features/results/` | Qualified, final-round, and CSV export pages |
| `services/cloudinaryService.js` | Image/PDF uploads and separate raw PDF downloads |
| `services/evaluationService.js` | HTTP call to Spring Boot using the Firebase ID token |
| `utils/` | Score precedence, sorting, dates, CSV downloads, file/registration helpers |
| `styles/index.css` | Imports 31 CSS sections in their original order |

Large forms retain their existing local state and Firestore operations to keep
this migration reviewable. This is a modular refactor, not a redesign or a switch
to a new state-management library. The separate features make future extractions
possible without changing the whole application at once.

## Flow 1 — participant submission

1. `useAppData` subscribes to Firestore rounds.
2. `App` chooses the round using the existing enabled/disabled behavior.
3. `PublicSite` passes it to `SubmissionForm`.
4. `FileUploader` validates the selected file using shared limits.
5. `SubmissionForm` validates participant details and calls `uploadToCloudinary`.
6. The upload service returns preview and original-download URLs.
7. The form writes the same submission fields to Firestore.

Spring Boot is not involved in this flow, just as Express was not involved before.

## Flow 2 — admin AI evaluation

1. `AdminLogin` signs in with Firebase.
2. `AdminDashboard` listens to rounds and submissions.
3. `SubmissionsTable` loads the selected round and obtains the Firebase ID token.
4. `requestDesignEvaluation` sends the existing JSON payload to Spring Boot.
5. Spring Security verifies the token signature, issuer, audience, and time claims,
   then requires an authorized admin UID or signed admin claim.
6. `EvaluationController` delegates to `EvaluationService`.
7. `ImageService` validates the Cloudinary URL, downloads the image, and encodes it.
8. `GeminiService` sends the prompt and image, with retries and configured fallbacks.
9. `EvaluationService` validates returned criteria and computes the score itself.
10. React receives the existing response shape and saves the evaluation to Firestore.

## Java map

| Package/file | Responsibility |
| --- | --- |
| `ArtifyApplication` | Starts Spring Boot |
| `config/SecurityConfig` | Bearer-token authentication, admin authorization, allowed origins |
| `config/RequestSizeFilter` | Preserves the 1 MB request-body limit |
| `controller/EvaluationController` | Exposes `/api/health` and `/api/evaluate-design` |
| `service/EvaluationService` | Criteria validation, prompt preparation, response normalization |
| `service/ImageService` | Restricted image download and PDF-to-JPG URL transformation |
| `service/GeminiService` | Gemini HTTP requests, three attempts per configured model, timeouts |
| `exception/` | Consistent JSON errors without exposing provider secrets |
| `resources/evaluation-rules.txt` | Original evaluation rules, separated from Java code |
| `src/test/` | Security and scoring/API-contract tests |

There is no JPA entity/repository layer because this conversion does not move
Firestore into a SQL database. Adding unused entity classes would misrepresent
the actual architecture.

## Suggested learning order

1. Read `main.jsx`, `App.jsx`, and `PublicSite.jsx` to understand composition and props.
2. Read `Field.jsx` and `FileUploader.jsx` for reusable components and validation.
3. Follow `SubmissionForm` into `cloudinaryService` for async/await and uploads.
4. Read `useAppData` for useEffect subscriptions and cleanup.
5. Follow the AI flow from `SubmissionsTable` through the Java controller and services.
6. Read the tests to understand what happens with unauthorized users or invalid scores.
