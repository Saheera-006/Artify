# ARTIFY — AI-Powered Design Submission & Evaluation Platform

<p align="center">
  <h3 align="center">THINK. CREATE. DEFINE.</h3>
  <p align="center">
    An AI-powered design submission and evaluation platform developed for DYNAMOZ'26.
    <br />
    Combining creative expression, cloud technology, and AI-assisted design evaluation.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Firebase-Data%20Management-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Cloudinary-Image%20Storage-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
  <img src="https://img.shields.io/badge/Google%20Gemini-AI%20Evaluation-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />
</p>

<p align="center">
  <a href="https://artify26.web.app">Live Application</a> •
  <a href="https://github.com/Saheera-006/Artify">GitHub Repository</a>
</p>

---

## 📌 About the Project

**ARTIFY** is an AI-powered design submission and evaluation platform developed for **DYNAMOZ'26**, the symposium conducted by the Department of Computer Science and Engineering at University College of Engineering, Nagercoil.

The platform provides a digital workflow for collecting creative design submissions, storing artwork in the cloud, managing submission information, and supporting design evaluation using Google Gemini AI.

ARTIFY combines **React, Firebase, Cloudinary, and Google Gemini AI** to bring the design submission and evaluation process into one platform.

The event was conducted across **two rounds**, with student event coordination and technology playing important roles in its execution.

## 🎯 Objectives

- Build a centralized platform for design competition submissions.
- Simplify the collection and management of creative entries.
- Store submitted design images using Cloudinary.
- Maintain submission information and image URLs in Firebase.
- Integrate Google Gemini AI into the design evaluation workflow.
- Support administrative review of submissions and evaluation results.
- Enable CSV export for evaluation data and reporting.
- Support the execution of a two-round college design competition.

## ✨ Features

### 🎨 Design Submission

- Digital interface for submitting creative designs.
- Organized submission workflow for the competition.
- Cloud-based storage for submitted artwork.

### ☁️ Cloudinary Image Storage

- Stores submitted design images using Cloudinary.
- Uses image URLs to reference uploaded artwork.
- Separates image file storage from application data storage.

### 🔥 Firebase Integration

- Stores submission-related information.
- Maintains Cloudinary image URLs associated with submissions.
- Supports the application's data management workflow.

### 🤖 Gemini AI Evaluation

- Integrates Google Gemini AI into the design evaluation workflow.
- Supports AI-assisted assessment of submitted designs.
- Helps streamline the evaluation process.

### 🛠️ Administrative Workflow

- Supports the management and review of design submissions.
- Provides a workflow for reviewing evaluation results.
- Helps organize competition-related data.

### 📊 CSV Export

- Supports exporting evaluation data in CSV format.
- Enables further review and analysis using spreadsheet applications.

### 🏆 Two-Round Competition

- Conducted as a two-round design event.
- Combines creative submissions with technology-supported evaluation.
- Connects the digital platform with the practical needs of event execution.

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| JavaScript | Application logic |
| Vite | Development and build tooling |
| Firebase | Application data management |
| Cloudinary | Cloud-based image storage |
| Google Gemini API | AI-assisted design evaluation |
| CSV | Evaluation data export |
| Firebase Hosting | Web hosting, if configured for the deployed application |

## 🏗️ System Architecture

ARTIFY uses separate services for its user interface, application data, image storage, and AI-assisted evaluation.

```text
                    ┌──────────────────────┐
                    │      ARTIFY UI       │
                    │        React          │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │ Design Submission    │
                    │      Workflow        │
                    └──────────┬───────────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
        ┌─────────▼─────────┐    ┌──────────▼─────────┐
        │    Cloudinary     │    │      Firebase      │
        │  Design Images    │    │ Submission Records │
        └─────────┬─────────┘    │   & Image URLs     │
                  │              └──────────┬─────────┘
                  └────────────┬────────────┘
                               │
                    ┌──────────▼───────────┐
                    │   Google Gemini AI   │
                    │  Design Evaluation   │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │ Evaluation Results   │
                    │    & CSV Export      │
                    └──────────────────────┘
```

*This diagram illustrates the main technologies and their roles. The exact request flow depends on the implementation.*

### How It Works

1. **Design submission:** A participant submits a design through the ARTIFY interface.
2. **Image upload:** The design image is uploaded to Cloudinary.
3. **Data storage:** The returned image URL and associated submission information are stored in Firebase.
4. **AI evaluation:** The evaluation workflow uses Google Gemini AI to assist in assessing submitted designs.
5. **Result management:** Evaluation information can be reviewed through the administrative workflow.
6. **Data export:** Available evaluation data can be exported as a CSV file.

## 🧩 Implementation Details

### 1. React Frontend

React powers the interactive interface for design submissions and administrative workflows. It connects the user-facing components with the application's data and evaluation services.

### 2. Firebase Data Management

Firebase supports the storage and retrieval of submission-related information. Cloudinary image URLs are stored alongside relevant application data, allowing the platform to reference uploaded artwork without storing the actual image files in Firebase documents.

### 3. Cloudinary Image Management

Cloudinary handles the storage of submitted design images. Once an image is uploaded, its URL can be associated with the corresponding submission record in Firebase.

### 4. Google Gemini AI Integration

Google Gemini AI is integrated into the design evaluation workflow, enabling AI-assisted assessment of creative submissions as part of the competition process.

### 5. Evaluation Data and CSV Export

The administrative workflow supports the review of submissions and evaluation results. CSV export allows available evaluation data to be reviewed and analyzed outside the application.

## 👩‍💻 My Role & Contribution

### Student Event Coordinator — ARTIFY

I served as the **Student Event Coordinator for ARTIFY**, a two-round design competition conducted as part of DYNAMOZ'26.

My involvement combined technical project work with event coordination, connecting the digital submission and evaluation workflow with the practical requirements of conducting a design competition.

**Key highlights:**

- Served as Student Event Coordinator for ARTIFY.
- Coordinated an event conducted across two rounds.
- Worked on a digital platform for design submissions and evaluation.
- Contributed to a project integrating cloud image storage, Firebase, and Gemini AI.
- Gained experience connecting software development with the execution of a real college event.

## 🖥️ Application Screenshots

Add screenshots of the actual application to showcase its interface and functionality.

| Design Submission | Admin Dashboard |
|---|---|
| Add `screenshots/submission-page.png` | Add `screenshots/admin-dashboard.png` |

| AI Evaluation | Evaluation Results |
|---|---|
| Add `screenshots/ai-evaluation.png` | Add `screenshots/evaluation-results.png` |

Create a `screenshots` folder in the repository and replace these placeholders with the actual screenshot paths after adding the image files.

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/)
- npm
- [Git](https://git-scm.com/)
- A Firebase project configured for the application
- A Cloudinary account and upload configuration
- Google Gemini API access for the AI evaluation workflow

### 1. Clone the Repository

```bash
git clone https://github.com/Saheera-006/Artify.git
```

### 2. Navigate to the Project Directory

```bash
cd Artify
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Inspect the existing source code to identify the exact environment variable names required by Firebase, Cloudinary, and Gemini. Create the necessary `.env` file in the appropriate project directory.

```env
# Add the variable names expected by your application.
# Firebase configuration
# Cloudinary configuration
# Google Gemini API configuration
```

This is a configuration template, not a ready-to-run `.env` file. Use the exact variable names referenced in the source code.

**Security note:** Never commit private API keys, service-account credentials, or other secrets to GitHub. Public frontend configuration and private server-side credentials must be handled appropriately for the services being used.

### 5. Start the Development Server

For a Vite-based application, run:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

### 6. Build for Production

```bash
npm run build
```

Refer to the project's `package.json` for the available scripts and build configuration.

## 🔐 Security Considerations

- Keep private API keys and service-account credentials out of source control.
- Avoid exposing privileged Gemini API credentials in public frontend code.
- Use an appropriate server-side endpoint for AI requests when private credentials are required.
- Configure Firebase Security Rules to protect submission and evaluation data.
- Restrict Cloudinary upload permissions and validate uploaded files.
- Validate submitted data before saving or processing it.
- Protect administrative operations with suitable authentication and authorization.

These are recommended practices. Verify the actual source code and deployment configuration before claiming that every measure is already implemented.

## 🌱 Future Enhancements

Potential improvements include:

- More detailed evaluation reports.
- Configurable evaluation criteria and scoring.
- Improved submission tracking and status visibility.
- Enhanced administrative analytics.
- Better participant feedback and result communication.
- Expanded reporting and export options.
- Additional safeguards and human review for AI-assisted evaluation.

## 🎓 Event Context

ARTIFY was conducted as part of **DYNAMOZ'26**, a symposium organized by the Department of Computer Science and Engineering at University College of Engineering, Nagercoil.

The two-round event combined creative design submissions with technology-supported evaluation. The platform demonstrates how frontend development, cloud image storage, database integration, and generative AI can support a real-world college competition workflow.

## 👩‍💻 Developer

**Fathima Saheera J**

B.E. Computer Science and Engineering  
University College of Engineering, Nagercoil

**Role:** Student Event Coordinator — ARTIFY

- **GitHub:** [Saheera-006](https://github.com/Saheera-006)
- **Portfolio:** [fathima-saheera.web.app](https://fathima-saheera.web.app)

## 📄 License

Add a license file if you intend to distribute this project under specific reuse terms. Until a license is included, the repository should not be assumed to grant permission for unrestricted reuse.

---

<p align="center">
  <strong>ARTIFY — THINK. CREATE. DEFINE.</strong>
  <br />
  Where creativity meets technology.
</p>
