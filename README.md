# ARTIFY — React + Spring Boot

This is a source conversion of the existing ARTIFY project, based on Git commit
`268d5a781d08f1be1e219221d6a07716d134598e`. It preserves the React design and existing
Firebase/Cloudinary data flows while replacing the Express AI service with Java.
Nothing has been pushed to GitHub, deployed, or written to the production database.

## Start here

1. Read [SETUP.md](docs/SETUP.md) for Windows, terminal, and Spring Tool Suite setup.
2. Read [STUDY_GUIDE.md](docs/STUDY_GUIDE.md) for the folders and feature flows.
3. Read [MIGRATION.md](docs/MIGRATION.md) before switching an existing deployment.
4. Read [VALIDATION.md](docs/VALIDATION.md) for checks and remaining live verification.

## Main folders

| Folder | Purpose |
| --- | --- |
| `frontend/` | React + Vite application, organized by feature |
| `backend/` | Spring Boot Maven application: controllers, services, security, tests |
| `legacy/express-server/` | Original Express source for comparison and rollback |
| `docs/` | Setup, study guide, migration details, validation |
| `firestore.rules` | Original Firestore rules; unchanged |
| `firebase.json` | Hosting now reads `frontend/dist` |

The ZIP contains application source and documentation. Original event documents,
old generated `dist` files, Git history, dependency folders, credentials, and build
outputs are excluded. Event documents in the original repository are untouched.

## Quick start

Use Node.js 22.12+ and JDK 17 or 21. Populate the configuration as described in
SETUP.md before opening the frontend.

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
# Fill .env with your existing Firebase and Cloudinary configuration.
npm run dev
```

In another terminal:

```powershell
cd backend
Copy-Item application-local.properties.example application-local.properties
# Fill application-local.properties.
.\mvnw.cmd spring-boot:run
```

Frontend: `http://localhost:5173`  
Admin: `http://localhost:5173/admin`  
Backend health: `http://localhost:5000/api/health`

Firebase login, Firestore, and Cloudinary remain external services. This conversion
is not a migration from Firestore to MySQL, and the health endpoint does not prove
that external credentials are configured correctly.
