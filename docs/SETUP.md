# Local setup — Windows and Spring Tool Suite

## 1. Keep your working project

Extract this ZIP into a new directory. Keep the current application and its
configuration separately until the new version passes your staging checks.
Do not run both backend servers on port 5000 at the same time.

## 2. Frontend configuration

In `frontend/`, copy `.env.example` to `.env` and use the same Firebase project
and Cloudinary values as your existing installation. For testing, a separate
Firebase project and Cloudinary cloud are preferable: real actions from this
frontend will write to whatever project you configure.

Keep `VITE_AI_API_URL=http://localhost:5000` for local work. Vite embeds all
`VITE_*` values in browser code: never put the Gemini key, a Cloudinary API secret,
or a Firebase service-account private key there. Restart Vite after changing `.env`.

```powershell
cd frontend
npm ci
npm run dev
```

## 3. Backend configuration

Copy `backend/application-local.properties.example` to
`backend/application-local.properties` and fill every placeholder.

| Setting | Where to get it |
| --- | --- |
| `artify.firebase-project-id` | Firebase project settings; must match frontend project |
| `artify.admin-uids` | Firebase Authentication > Users > UID of each authorized administrator |
| `artify.allowed-origins` | Exact frontend origins, comma separated, no trailing slash |
| `artify.cloudinary-cloud-name` | Cloudinary cloud used by your current uploads |
| `artify.gemini-api-key` | Your server-side Gemini API key |
| `artify.gemini-models` | Exact model ID your account can access; optional fallback IDs separated by commas |

Use the SAME Cloudinary cloud in frontend and backend. The Java service accepts
only HTTPS `res.cloudinary.com/<configured-cloud>/image/upload/...` assets.
Original PDF preview conversion is supported. Custom CDN domains are not supported
by this initial conversion.

The Java server validates Firebase ID tokens with Google's public signing keys.
It does not need the old `serviceAccountKey.json`. A verified Firebase `admin=true`
custom claim also authorizes AI evaluation, in addition to the UID allowlist.
Do not put admin UIDs in frontend code as an authorization mechanism.

Run from `backend/` so the local properties file is found:

```powershell
.\mvnw.cmd spring-boot:run
```

macOS/Linux: `./mvnw spring-boot:run`. If Maven is already installed,
`mvn spring-boot:run` also works. The wrapper downloads Maven on first use.

Environment variables supported instead of the local file:
`PORT`, `FIREBASE_PROJECT_ID`, `ADMIN_UIDS`, `ALLOWED_ORIGINS`,
`CLOUDINARY_CLOUD_NAME`, `GEMINI_API_KEY`, `GEMINI_MODELS`.
Spring does not automatically load the old Express `.env` file.

## 4. Spring Tool Suite

1. File > Import > Maven > Existing Maven Projects.
2. Select `backend/`, check `pom.xml`, and finish.
3. Use JDK 17 or 21 for the project.
4. In Run Configurations, set the working directory to the `backend` project
   directory, or supply environment variables instead of the local properties file.
5. Run `com.artify.ArtifyApplication` as a Spring Boot App.
6. Start React separately in a terminal with `npm run dev` from `frontend/`.

## 5. Checks and builds

```powershell
# frontend directory
npm run lint
npm test
npm run format:check
npm run build

# backend directory
.\mvnw.cmd test
.\mvnw.cmd package
java -jar target\artify-backend-1.0.0.jar
```

A production frontend needs the backend's HTTPS URL in `VITE_AI_API_URL` before
building. The backend needs the exact production frontend origin in
`ALLOWED_ORIGINS`. Firebase Hosting serves the React build; it does not run the
Spring Boot JAR. Deploy that JAR on a separate Java-capable service.
