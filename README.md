 <div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:000000,50:17251A,100:497746&height=240&section=header&text=ARTIFY&fontColor=FFFFFF&fontSize=75&fontAlignY=38&desc=THINK.%20CREATE.%20DEFINE.&descAlignY=60&descSize=22" width="100%" alt="ARTIFY — Think. Create. Define." />

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=17&pause=1200&color=7BB875&center=true&vCenter=true&width=750&lines=AI-Powered+Design+Submission+Platform;Cloudinary+%2B+Firebase+Integration;Gemini+AI-Assisted+Design+Evaluation;Two-Round+Design+Competition;Student+Event+Coordination" alt="ARTIFY animated introduction" />

<br/>

<img src="https://img.shields.io/badge/React-Frontend-497746?style=for-the-badge&logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/Firebase-Database-5C9C58?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase" />
<img src="https://img.shields.io/badge/Cloudinary-Image%20Storage-497746?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
<img src="https://img.shields.io/badge/Gemini-AI%20Evaluation-5C9C58?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini AI" />

<br/><br/>

[![GitHub Repository](https://img.shields.io/badge/GitHub-Explore%20Repository-17251A?style=for-the-badge&logo=github&logoColor=7BB875)](https://github.com/Saheera-006/Artify)
[![Live Application](https://img.shields.io/badge/Live-Application-497746?style=for-the-badge&logo=firebase&logoColor=white)](https://artify26.web.app)

</div>

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%" alt="" />

## ✦ About ARTIFY

**ARTIFY** is an AI-powered design submission and evaluation platform developed for **DYNAMOZ'26**, the symposium organized by the Department of Computer Science and Engineering at University College of Engineering, Nagercoil.

Built around the idea of *Think. Create. Define.*, ARTIFY brings creative design submissions, cloud image storage, and AI-assisted evaluation together in a digital platform.

The application integrates React, Firebase, Cloudinary, and Google Gemini AI to support the design competition workflow.

<div align="center">

| 🎨 Creative Submissions | ☁️ Cloud Storage | 🤖 AI Evaluation |
|:---:|:---:|:---:|
| Digital design workflow | Cloudinary + Firebase | Gemini AI integration |

</div>

## ✦ Highlights

- 🎨 **Design Submissions** — A digital platform for collecting creative entries.
- ☁️ **Cloudinary Integration** — Stores submitted design images in the cloud.
- 🔥 **Firebase Integration** — Stores submission information and associated image URLs.
- 🤖 **Gemini AI Evaluation** — Integrates Google Gemini AI into the design evaluation workflow.
- 📊 **CSV Export** — Supports exporting evaluation data for further analysis.
- 🏆 **Two-Round Event** — Developed for a design competition conducted in two rounds.
- 👩🏻‍💻 **Event Coordination** — The project is connected to my role as Student Event Coordinator for ARTIFY.

## ✦ Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=react,js,vite,firebase&theme=dark" alt="React, JavaScript, Vite, Firebase" />

<br/>

<img src="https://img.shields.io/badge/Cloudinary-Image%20Management-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
<img src="https://img.shields.io/badge/Google%20Gemini-Generative%20AI-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />

</div>

| Technology | Role |
|---|---|
| React | Interactive frontend |
| JavaScript | Application logic |
| Vite | Development and build tooling |
| Firebase | Application data management |
| Cloudinary | Design image storage |
| Google Gemini API | AI-assisted design evaluation |
| CSV | Evaluation data export |

## ✦ How ARTIFY Works

```mermaid
flowchart TD
    A["🎨 Design Submission"] --> B["React Application"]
    B --> C["Cloudinary Image Upload"]
    C --> D["Image URL"]
    D --> E["Firebase Submission Data"]
    E --> F["Gemini AI Evaluation Workflow"]
    F --> G["Evaluation Results"]
    G --> H["CSV Export"]

    style A fill:#17251A,stroke:#497746,color:#FFFFFF
    style B fill:#17251A,stroke:#497746,color:#FFFFFF
    style C fill:#263D2A,stroke:#5C9C58,color:#FFFFFF
    style D fill:#263D2A,stroke:#5C9C58,color:#FFFFFF
    style E fill:#263D2A,stroke:#5C9C58,color:#FFFFFF
    style F fill:#17251A,stroke:#7BB875,color:#FFFFFF
    style G fill:#263D2A,stroke:#5C9C58,color:#FFFFFF
    style H fill:#17251A,stroke:#497746,color:#FFFFFF
```

*The diagram represents the overall workflow conceptually; actual request sequencing depends on the implementation.*

### 1. Submit

Participants submit their creative designs through the application.

### 2. Store

Design images are uploaded to Cloudinary, while their image URLs and associated submission details are stored in Firebase.

### 3. Evaluate

Google Gemini AI is integrated into the design evaluation process to support AI-assisted assessment.

### 4. Review and Export

The platform supports reviewing evaluation information and exporting available evaluation data in CSV format.

## ✦ My Role & Contribution

### Student Event Coordinator — ARTIFY

I served as the **Student Event Coordinator for ARTIFY**, a design event conducted across two rounds as part of DYNAMOZ'26.

This experience brought together technology and event execution, connecting the digital submission and evaluation workflow with the practical requirements of organizing a college-level design competition.

- Served as Student Event Coordinator for the ARTIFY event.
- Coordinated an event conducted across two rounds.
- Worked on a platform integrating design submissions, cloud image storage, and AI-assisted evaluation.
- Explored the use of generative AI in a creative competition workflow.

## ✦ Application Preview

<div align="center">

| Design Submission | Administration |
|:---:|:---:|
| Add your submission-page screenshot | Add your admin-page screenshot |
| AI Evaluation | Evaluation Results |
| Add your actual evaluation screenshot | Add your actual results screenshot |

</div>

To display screenshots, create a `screenshots` directory in this repository and replace the descriptions above with Markdown image references to your actual screenshot files.

## ✦ Run Locally

### Prerequisites

- Node.js and npm
- Git
- Firebase project configuration
- Cloudinary account and upload configuration
- Google Gemini API access for the evaluation workflow

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Saheera-006/Artify.git
```

**2. Open the project directory**

```bash
cd Artify
```

**3. Install dependencies**

```bash
npm install
```

**4. Configure environment variables**

Check the source code for the exact environment variable names and create the required `.env` file.

```env
# Configure the variables required by your application.
# Firebase configuration
# Cloudinary configuration
# Gemini API configuration
```

This is a placeholder template. The variable names must match those used in your project.

**5. Start the development server**

```bash
npm run dev
```

**6. Build the application**

```bash
npm run build
```

Refer to `package.json` for the project's actual scripts and configuration.

## ✦ Security Notes

- Never commit private API keys or service-account credentials.
- Keep privileged Gemini credentials out of publicly accessible frontend code.
- Configure appropriate Firebase Security Rules.
- Validate uploaded files and submitted data.
- Restrict administrative operations to authorized users.

These are recommended practices; check the current implementation to determine which protections are already in place.

## ✦ Future Scope

- Enhanced evaluation analytics and reports.
- More configurable evaluation criteria.
- Improved submission tracking.
- Better administrative reporting.
- Expanded result-export options.
- Additional safeguards for AI-assisted evaluation.

## ✦ Event Details

**Event:** ARTIFY — DYNAMOZ'26

**Department:** Computer Science and Engineering

**Institution:** University College of Engineering, Nagercoil

**Event Format:** Two-round design competition

**My Role:** Student Event Coordinator

## ✦ About the Developer

<div align="center">

### Fathima Saheera J

Aspiring Full Stack Developer · Student Event Coordinator · Technology Enthusiast

A Computer Science and Engineering student interested in building practical applications, exploring emerging technologies, and bringing ideas to life through software development.

[![GitHub](https://img.shields.io/badge/GitHub-Saheera--006-17251A?style=for-the-badge&logo=github&logoColor=7BB875)](https://github.com/Saheera-006)

[![Portfolio](https://img.shields.io/badge/Portfolio-Visit%20Website-497746?style=for-the-badge&logo=googlechrome&logoColor=white)](https://fathima-saheera.web.app)

</div>

## ✦ License

A license has not been specified. Add a `LICENSE` file if you intend to grant others permission to reuse, modify, or distribute the project.

---

<div align="center">

### ARTIFY

**THINK. CREATE. DEFINE.**

*Where creativity meets technology.*

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:497746,50:17251A,100:000000&height=120&section=footer" width="100%" alt="" />

</div>
