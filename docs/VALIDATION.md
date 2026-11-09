# Validation results

Validated on 9 November 2026 against source commit
`268d5a781d08f1be1e219221d6a07716d134598e`.

| Check | Result |
| --- | --- |
| Original React production build | Passed before modification |
| Modular React production build | Passed |
| ESLint undefined identifiers and JSX components | Passed |
| Prettier source/test formatting | Passed |
| Frontend domain tests | 6 passed |
| Java security tests | 10 passed |
| Java evaluation/URL/API-contract tests | 8 passed |
| Maven package | Passed; executable Spring Boot JAR created |
| Packaged JAR health endpoint | HTTP 200, `ok: true` |
| Packaged JAR evaluation without authentication | HTTP 401 |
| Extracted declarations compared with original AST after consistent formatting | 40 unchanged |
| Original Firestore rules and indexes | Unchanged |

The three intentionally edited original components are `App`, `SubmissionForm`,
and `SubmissionsTable`. Their subscriptions, Cloudinary upload function, and HTTP
request were moved into reusable hooks/services. The remaining declarations were
compared programmatically after formatting, ignoring parser locations/comments.

The original and modular production builds generate the same CSS asset:
`index-FPzNLntV.css` (SHA-256
`071b1c9be5d88fb5dd50498488bf6382d8bf5680c3f28418b750a59789595315`).
This checks the compiled stylesheet, not every possible browser interaction.
The existing Vite warning about a JavaScript bundle larger than 500 kB remains.

The backend tests use mocked Firebase token decoding and Gemini/image responses.
They do not contact your production accounts. No real submission, upload, scoring
request, or database mutation was performed. A real Firebase login and signing-key
fetch, actual Cloudinary uploads/PDF transformations, and live Gemini evaluation
still require your private configuration and staging end-to-end tests.

Node-based frontend tests cover score precedence, tie breaking, non-mutating
sorting, round availability, timestamp compatibility, registration validation,
and file extensions. They are not browser end-to-end tests.

Maven tests use Mockito's subclass mock maker so they run without JVM self-attach;
this affects tests only. Java source uses standard Google Java formatting.
