import React, { useEffect, useMemo, useState } from "react";
import "./style.css";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth, db } from "./firebase";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const DEFAULT_CRITERIA = [
  {
    name: "Creativity",
    maxScore: 20,
    description: "Originality and creative approach.",
  },
  {
    name: "Visual Design",
    maxScore: 20,
    description:
      "Layout, hierarchy, typography, color and visual consistency.",
  },
  {
    name: "Relevance",
    maxScore: 20,
    description:
      "How well the design addresses the round theme and problem statement.",
  },
  {
    name: "Content Quality",
    maxScore: 20,
    description:
      "Clarity, completeness and quality of visible content.",
  },
  {
    name: "Technical Quality",
    maxScore: 20,
    description:
      "Execution quality, readability and visible technical polish.",
  },
];

const AI_API_URL =
  import.meta.env.VITE_AI_API_URL || "http://localhost:5000";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf",
];

const ALLOWED_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "pdf",
];

const DEPARTMENTS = [
  "CSE A",
  "CSE B",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "IT",
];

const YEARS = [
  "I Year",
  "II Year",
  "III Year",
  "IV Year",
];

/* =========================================================
   HELPERS
========================================================= */

function getScore(submission) {
  if (typeof submission.finalScore === "number") {
    return submission.finalScore;
  }

  if (typeof submission.marks === "number") {
    return submission.marks;
  }

  if (typeof submission.aiScore === "number") {
    return submission.aiScore;
  }

  return null;
}

function timestampToMillis(value) {
  if (!value) return 0;

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (value.seconds) {
    return value.seconds * 1000;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return 0;
}

function formatDateTime(value) {
  const millis = timestampToMillis(value);

  if (!millis) return "—";

  return new Date(millis).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDate(value) {
  const millis = timestampToMillis(value);

  if (!millis) return "—";

  return new Date(millis).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getRoundState(round) {
  if (!round) return "none";

  // Round availability is controlled only by the admin Enable/Disable switch.
  return round.enabled ? "active" : "disabled";
}

function getRoundStateLabel(round) {
  const state = getRoundState(round);

  const labels = {
    active: "OPEN",
    upcoming: "UPCOMING",
    closed: "CLOSED",
    disabled: "DISABLED",
    none: "NO ROUND",
  };

  return labels[state] || "—";
}

function makeRoundId(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now()
  );
}

function getExtension(filename = "") {
  return (
    filename.split(".").pop()?.toLowerCase() || ""
  );
}

function isValidRegisterNumber(value) {
  return /^\d{12}$/.test(value);
}

function downloadCSV(filename, rows) {
  if (!rows.length) {
    alert("No data available.");
    return;
  }

  const headers = Object.keys(rows[0]);

  const escapeCSV = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCSV(row[header])).join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/* =========================================================
   REVEAL
========================================================= */

function useReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) =>
        el.classList.add("visible")
      );

      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
      }
    );

    elements.forEach((el) =>
      observer.observe(el)
    );

    return () => observer.disconnect();
  }, []);
}

/* =========================================================
   NAVBAR
========================================================= */

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (id) => {
    setMenuOpen(false);

    const element =
      document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <button
          className="brand"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          <span className="brand-mark">A</span>

          <span>
            ARTIFY<span className="brand-dot">.</span>
          </span>
        </button>

        <nav
          className={`nav-links ${
            menuOpen ? "open" : ""
          }`}
        >
          

          <button
            onClick={() => goTo("challenge")}
          >
            Challenge
          </button>

          <button
            onClick={() => goTo("guidelines")}
          >
            Guidelines
          </button>

          <button
            className="nav-submit"
            onClick={() => goTo("submit")}
          >
            Submit
          </button>
        </nav>

        <button
          className={`hamburger ${
            menuOpen ? "active" : ""
          }`}
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero({ round }) {
  const state = getRoundState(round);

  const scrollToSubmit = () => {
    document
      .getElementById("submit")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  return (
    <section className="hero">
      <div className="hero-grid" />

      <div className="hero-content">
        <div className="eyebrow">
          <span className="status-dot" />
          DESIGN CHALLENGE · DYNAMOZ '26
        </div>

        <h1>
          ARTI<span>FY</span>
        </h1>

        <div className="hero-line" />

        <p className="hero-tagline">
          THINK. CREATE. <strong>DEFINE.</strong>
        </p>

        {round ? (
          <div className="hero-round">
            <div>
              <span className="mini-label">
                CURRENT CHALLENGE
              </span>

              <strong>{round.name}</strong>
            </div>

            <span
              className={`round-pill ${state}`}
            >
              {getRoundStateLabel(round)}
            </span>
          </div>
        ) : (
          <div className="hero-round empty">
            No challenge is currently open.
          </div>
        )}

        <button
          className="primary-btn"
          onClick={scrollToSubmit}
          disabled={state !== "active"}
        >
          {state === "active"
            ? "Enter Challenge"
            : "Submissions Closed"}

          <span>→</span>
        </button>
      </div>

      <div className="hero-bottom">
        <span>
          DEPARTMENT OF COMPUTER SCIENCE AND
          ENGINEERING
        </span>

        <span>01 — 01</span>
      </div>
    </section>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHead({
  number,
  title,
  text,
}) {
  return (
    <div className="section-head reveal">
      <span className="section-number">
        {number}
      </span>

      <div>
        <h2>{title}</h2>

        {text && <p>{text}</p>}
      </div>
    </div>
  );
}

/* =========================================================
   CHALLENGE
========================================================= */

function Challenge({ round }) {
  if (!round) {
    return (
      <section
        id="challenge"
        className="section"
      >
        <SectionHead
          number="02"
          title="THE CHALLENGE"
          text="The next challenge will appear here."
        />

        <div className="empty-card reveal">
          <span>NO ACTIVE CHALLENGE</span>

          <p>
            Stay tuned. The next round will be
            available soon.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="challenge"
      className="section challenge-section"
    >
      <SectionHead
        number="02"
        title={round.name}
        text={
          round.description ||
          "Your creative challenge starts here."
        }
      />

      <div className="challenge-card reveal">
        <div className="challenge-top">
          <div>
            <span className="mini-label">
              THEME
            </span>

            <h3>
              {round.theme || "—"}
            </h3>
          </div>

          <span
            className={`round-pill ${getRoundState(
              round
            )}`}
          >
            {getRoundStateLabel(round)}
          </span>
        </div>

        <div className="challenge-problem">
          <span className="mini-label">
            PROBLEM STATEMENT
          </span>

          <p>
            {round.problemStatement ||
              "Create a design that communicates your idea clearly and creatively."}
          </p>
        </div>

        {Array.isArray(round.creativeBrief) && round.creativeBrief.filter(Boolean).length > 0 && (
          <div className="creative-brief-card reveal">
            <div className="creative-brief-heading">
              <div>
                <span className="mini-label">THE CREATIVE BRIEF</span>
                <h3>Key elements your design should communicate or include.</h3>
              </div>
              <span className="creative-brief-mark">✦</span>
            </div>
            <div className="creative-brief-grid">
              {round.creativeBrief.filter(Boolean).map((item, index) => (
                <div className="creative-brief-item" key={`${item}-${index}`}>
                  <span className="creative-brief-number">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{item}</strong>
                    <small>REQUIRED ELEMENT</small>
                  </div>
                  <span className="creative-brief-arrow">↗</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="challenge-meta">
<div>
            <span>FORMAT</span>

            <strong>
              {(round.allowedDesignTypes ||
                [])
                .map((type) =>
                  type === "ui"
                    ? "UI Design"
                    : "Poster Design"
                )
                .join(" / ") || "—"}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   GUIDELINES
========================================================= */

function Guidelines({ round }) {
  const guidelines =
    round?.guidelines?.length > 0
      ? round.guidelines
      : [
          "Create an original design based on the given challenge.",
          "Choose either UI Design or Poster Design.",
          "Use only the allowed file formats.",
          "Make sure your register number and details are correct.",
          "Submit your final design before the deadline.",
        ];

  return (
    <section
      id="guidelines"
      className="section guidelines-section"
    >
      <SectionHead
        number="03"
        title="GUIDELINES"
        text="Read before you submit."
      />

      <div className="guideline-list reveal">
        {guidelines.map(
          (item, index) => (
            <div
              className="guideline-row"
              key={index}
            >
              <span>
                {String(index + 1).padStart(
                  2,
                  "0"
                )}
              </span>

              <p>{item}</p>

              <b>↗</b>
            </div>
          )
        )}
      </div>
    </section>
  );
}

/* =========================================================
   FILE UPLOADER
========================================================= */

function FileUploader({
  file,
  setFile,
  disabled,
}) {
  const [dragging, setDragging] =
    useState(false);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    const extension =
      getExtension(selectedFile.name);

    if (
      !ALLOWED_TYPES.includes(
        selectedFile.type
      ) &&
      !ALLOWED_EXTENSIONS.includes(
        extension
      )
    ) {
      alert(
        "Only PNG, JPG, JPEG or PDF files are allowed."
      );
      return;
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      alert(
        "Maximum file size is 10 MB."
      );
      return;
    }

    setFile(selectedFile);
  };

  return (
    <div
      className={`file-uploader ${
        dragging ? "dragging" : ""
      } ${disabled ? "disabled" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();

        if (!disabled) {
          setDragging(true);
        }
      }}
      onDragLeave={() =>
        setDragging(false)
      }
      onDrop={(event) => {
        event.preventDefault();

        setDragging(false);

        if (!disabled) {
          handleFile(
            event.dataTransfer.files?.[0]
          );
        }
      }}
    >
      <input
        id="design-upload"
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        disabled={disabled}
        onChange={(event) =>
          handleFile(
            event.target.files?.[0]
          )
        }
      />

      {!file ? (
        <label
          htmlFor="design-upload"
          className="upload-content"
        >
          <div className="upload-icon">
            ↑
          </div>

          <strong>
            Drop your design here or{" "}
            <span>browse</span>
          </strong>

          <small>
            PNG, JPG, JPEG or PDF · Maximum
            10 MB
          </small>
        </label>
      ) : (
        <div className="selected-file">
          <div className="file-symbol">
            FILE
          </div>

          <div>
            <strong>
              {file.name}
            </strong>

            <small>
              {(
                file.size /
                1024 /
                1024
              ).toFixed(2)}{" "}
              MB
            </small>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={() =>
                setFile(null)
              }
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  children,
}) {
  return (
    <label className="form-field">
      <span>{label}</span>

      {children || (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

/* =========================================================
   SUBMISSION FORM
========================================================= */

function SubmissionForm({ round }) {
  const [step, setStep] =
    useState(1);

  const [name, setName] =
    useState("");

  const [
    registerNumber,
    setRegisterNumber,
  ] = useState("");

  const [
    department,
    setDepartment,
  ] = useState("");

  const [year, setYear] =
    useState("");

  const [
    designType,
    setDesignType,
  ] = useState("");

  const [file, setFile] =
    useState(null);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    showConfirm,
    setShowConfirm,
  ] = useState(false);

  const [success, setSuccess] =
    useState(false);

  const allowedTypes =
    round?.allowedDesignTypes || [
      "ui",
      "poster",
    ];

  const roundState =
    getRoundState(round);

  const validateDetails = () => {
    if (!name.trim()) {
      alert("Please enter your name.");
      return false;
    }

    if (
      !isValidRegisterNumber(
        registerNumber
      )
    ) {
      alert(
        "Register Number must contain exactly 12 digits."
      );
      return false;
    }

    if (!department) {
      alert(
        "Please select your department."
      );
      return false;
    }

    if (!year) {
      alert(
        "Please select your year."
      );
      return false;
    }

    return true;
  };

  const validateDesign = () => {
    if (!designType) {
      alert(
        "Please choose UI Design or Poster Design."
      );
      return false;
    }

    if (!file) {
      alert(
        "Please upload your design."
      );
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (
      step === 1 &&
      !validateDetails()
    ) {
      return;
    }

    if (
      step === 2 &&
      !validateDesign()
    ) {
      return;
    }

    setStep((current) =>
      Math.min(current + 1, 3)
    );
  };

  const previousStep = () => {
    setStep((current) =>
      Math.max(current - 1, 1)
    );
  };

  const uploadToCloudinary = async (selectedFile) => {
    const cloudName =
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    const uploadPreset =
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Cloudinary configuration is missing."
      );
    }

    const extension = getExtension(selectedFile.name);
    const isPdf = extension === "pdf";

    const renamedFile = new File(
      [selectedFile],
      `${registerNumber}.${extension}`,
      {
        type: selectedFile.type || (isPdf ? "application/pdf" : "image/jpeg"),
      }
    );

    const formData = new FormData();
    formData.append("file", renamedFile);
    formData.append("upload_preset", uploadPreset);
    formData.append(
      "folder",
      `artify/submissions/${round.id}`
    );

    /*
     * PDFs are intentionally uploaded as Cloudinary image assets.
     * Cloudinary supports PDF transformations (including page -> JPG),
     * which lets the admin preview PDFs as images even when direct PDF
     * delivery is disabled on a free Cloudinary account.
     */
    // Always keep the preview asset as an IMAGE resource.
    // Cloudinary can rasterize PDF pages to JPG from an image-resource PDF.
    const previewResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const previewResult =
      await previewResponse.json().catch(() => null);

    if (!previewResponse.ok) {
      throw new Error(
        previewResult?.error?.message ||
          "Cloudinary preview upload failed."
      );
    }

    // PDFs are also uploaded once as RAW. This gives us a separate original
    // download URL that is not dependent on Cloudinary PDF delivery from the
    // image resource. fl_attachment can be used on raw assets as well.
    let downloadResult = previewResult;

    if (isPdf) {
      const rawFormData = new FormData();
      rawFormData.append("file", renamedFile);
      rawFormData.append("upload_preset", uploadPreset);
      rawFormData.append(
        "folder",
        `artify/submissions/${round.id}`
      );

      const rawResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
        {
          method: "POST",
          body: rawFormData,
        }
      );

      downloadResult =
        await rawResponse.json().catch(() => null);

      if (!rawResponse.ok) {
        throw new Error(
          downloadResult?.error?.message ||
            "Cloudinary original PDF upload failed."
        );
      }
    }

    return {
      ...previewResult,
      previewUrl: previewResult.secure_url,
      downloadUrl: downloadResult.secure_url,
      downloadPublicId:
        downloadResult.public_id ||
        previewResult.public_id ||
        "",
      downloadResourceType:
        downloadResult.resource_type ||
        "image",
    };
  };

  const finalSubmit = async () => {
    if (!round || submitting) {
      return;
    }

    if (
      getRoundState(round) !==
      "active"
    ) {
      alert(
        "This round is no longer open."
      );

      setShowConfirm(false);

      return;
    }

    if (!file) {
      alert(
        "Please upload your design."
      );

      return;
    }

    setSubmitting(true);

    const clickTime = Date.now();

    try {
      const submissionId =
        `${round.id}_${registerNumber}`;

      const submissionRef =
        doc(
          db,
          "submissions",
          submissionId
        );

      const cloudinaryResult =
        await uploadToCloudinary(
          file
        );

      if (
        !cloudinaryResult?.secure_url
      ) {
        throw new Error(
          "Design upload failed. Please try again."
        );
      }

      const extension =
        getExtension(file.name);

      // AI evaluates a JPG/PNG representation. For PDFs, Cloudinary's image
      // delivery can rasterize page 1 as JPG, so the AI service receives an
      // actual image URL instead of a PDF URL that may be blocked for delivery.
      let aiFileUrl =
        cloudinaryResult.secure_url;

      let aiFileName =
        `${registerNumber}.${extension}`;

      if (extension === "pdf") {
        aiFileUrl = cloudinaryResult.secure_url
          .replace(
            "/image/upload/",
            "/image/upload/pg_1/"
          )
          .replace(
            /\.pdf(?=([?#]|$))/i,
            ".jpg"
          );

        aiFileName =
          `${registerNumber}.jpg`;
      }

      await setDoc(
        submissionRef,
        {
          roundId: round.id,
          roundName:
            round.name || "",
          name: name.trim(),
          registerNumber:
            registerNumber.trim(),
          department,
          year,
          designType,

          fileName:
            `${registerNumber}.${extension}`,

          // fileUrl remains the preview asset. For PDFs this is an image
          // resource so page previews work without the browser PDF viewer.
          fileUrl:
            cloudinaryResult.previewUrl ||
            cloudinaryResult.secure_url,

          // Original download asset. PDFs use a RAW Cloudinary asset; images
          // use their normal image delivery URL.
          downloadUrl:
            cloudinaryResult.downloadUrl ||
            cloudinaryResult.secure_url,

          // AI should analyze the preview image for PDFs, not the blocked
          // original PDF delivery URL.
          aiFileUrl,

          aiFileName,

          filePublicId:
            cloudinaryResult.public_id ||
            "",

          fileResourceType:
            cloudinaryResult.resource_type ||
            "image",

          downloadResourceType:
            cloudinaryResult.downloadResourceType ||
            "image",

          fileFormat:
            cloudinaryResult.format ||
            extension,

          filePages:
            Number(cloudinaryResult.pages || 1),

          submittedAt:
            serverTimestamp(),

          submittedAtClient:
            Timestamp.fromMillis(
              clickTime
            ),

          marks: null,
          aiScore: null,
          aiEvaluation: null,
          finalScore: null,

          status: "submitted",
          selected: false,

          createdAt:
            serverTimestamp(),
        }
      );

      setSuccess(true);
      setShowConfirm(false);
    } catch (error) {
      console.error(
        "SUBMISSION ERROR:",
        error
      );

      let message =
        "Something went wrong while submitting. Please try again.";

      if (
        error?.code ===
          "permission-denied" ||
        error?.message?.includes(
          "Missing or insufficient permissions"
        )
      ) {
        message =
          "Unable to submit right now. Please check your details and try again.";
      } else if (
        error?.message?.includes(
          "Cloudinary"
        )
      ) {
        message =
          "Unable to upload your design. Please try again.";
      } else if (error?.message) {
        message = error.message;
      }

      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!round) {
    return (
      <section
        id="submit"
        className="section"
      >
        <SectionHead
          number="04"
          title="SUBMIT"
          text="Submission is currently unavailable."
        />

        <div className="empty-card">
          <span>
            WAIT FOR THE NEXT ROUND
          </span>

          <p>
            A new challenge will appear
            here once it is enabled.
          </p>
        </div>
      </section>
    );
  }

  if (success) {
    return (
      <section
        id="submit"
        className="section submit-section"
      >
        <div className="success-card reveal visible">
          <div className="success-mark">
            ✓
          </div>

          <span className="mini-label">
            SUBMISSION RECEIVED
          </span>

          <h2>You're in.</h2>

          <p>
            Your{" "}
            {designType === "ui"
              ? "UI"
              : "Poster"}{" "}
            Design has been successfully
            submitted for{" "}
            <strong>
              {round.name}
            </strong>
            .
          </p>

          <div className="success-register">
            {registerNumber}
          </div>

          <small>
            Please keep your register
            number for future reference.
          </small>
        </div>
      </section>
    );
  }

  return (
    <section
      id="submit"
      className="section submit-section"
    >
      <SectionHead
        number="04"
        title="SUBMIT YOUR DESIGN"
        text="Simple. Fast. One final submission."
      />

      <div className="submission-card reveal">
        <div className="stepper">
          {[1, 2, 3].map(
            (item) => (
              <div
                className={`step ${
                  step >= item
                    ? "active"
                    : ""
                }`}
                key={item}
              >
                <span>{item}</span>

                <small>
                  {item === 1
                    ? "Details"
                    : item === 2
                    ? "Design"
                    : "Review"}
                </small>
              </div>
            )
          )}
        </div>

        {roundState === "disabled" && (
          <div className="submission-alert">
            <strong>This round is currently disabled.</strong>
            <span>Submissions are unavailable right now.</span>
          </div>
        )}

        {step === 1 && (
          <div className="form-section">
            <div className="form-heading">
              <span>01</span>

              <div>
                <h3>
                  Your details
                </h3>

                <p>
                  Enter your participant
                  information.
                </p>
              </div>
            </div>

            <div className="form-grid">
              <Field
                label="Name"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Your full name"
              />

              <Field
                label="Register Number"
                value={
                  registerNumber
                }
                onChange={(e) =>
                  setRegisterNumber(
                    e.target.value
                      .replace(
                        /\D/g,
                        ""
                      )
                      .slice(
                        0,
                        12
                      )
                  )
                }
                placeholder="12 digit register number"
              />

              <Field
                label="Department"
                value={department}
                onChange={(e) =>
                  setDepartment(
                    e.target.value
                  )
                }
              >
                <select
                  value={
                    department
                  }
                  onChange={(e) =>
                    setDepartment(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Select department
                  </option>

                  {DEPARTMENTS.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field
                label="Year"
                value={year}
                onChange={(e) =>
                  setYear(
                    e.target.value
                  )
                }
              >
                <select
                  value={year}
                  onChange={(e) =>
                    setYear(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Select year
                  </option>

                  {YEARS.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="form-section">
            <div className="form-heading">
              <span>02</span>

              <div>
                <h3>
                  Choose your design
                </h3>

                <p>
                  Select one design
                  category and upload
                  your final work.
                </p>
              </div>
            </div>

            <div className="design-options">
              {allowedTypes.includes(
                "ui"
              ) && (
                <button
                  type="button"
                  className={`design-option ${
                    designType ===
                    "ui"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setDesignType(
                      "ui"
                    )
                  }
                >
                  <span>UI</span>

                  <strong>
                    UI Design
                  </strong>

                  <small>
                    Interface / Web Design
                  </small>

                  <b>
                    {designType ===
                    "ui"
                      ? "✓"
                      : "○"}
                  </b>
                </button>
              )}

              {allowedTypes.includes(
                "poster"
              ) && (
                <button
                  type="button"
                  className={`design-option ${
                    designType ===
                    "poster"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setDesignType(
                      "poster"
                    )
                  }
                >
                  <span>POST</span>

                  <strong>
                    Poster Design
                  </strong>

                  <small>
                    Creative Visual Poster
                  </small>

                  <b>
                    {designType ===
                    "poster"
                      ? "✓"
                      : "○"}
                  </b>
                </button>
              )}
            </div>

            <FileUploader
              file={file}
              setFile={setFile}
              disabled={
                roundState !==
                "active"
              }
            />
          </div>
        )}

        {step === 3 && (
          <div className="form-section">
            <div className="form-heading">
              <span>03</span>

              <div>
                <h3>Review</h3>

                <p>
                  Check everything
                  before final
                  submission.
                </p>
              </div>
            </div>

            <div className="review-grid">
              <div>
                <span>NAME</span>
                <strong>
                  {name}
                </strong>
              </div>

              <div>
                <span>
                  REGISTER NUMBER
                </span>

                <strong>
                  {registerNumber}
                </strong>
              </div>

              <div>
                <span>
                  DEPARTMENT
                </span>

                <strong>
                  {department}
                </strong>
              </div>

              <div>
                <span>YEAR</span>

                <strong>
                  {year}
                </strong>
              </div>

              <div>
                <span>
                  DESIGN TYPE
                </span>

                <strong>
                  {designType ===
                  "ui"
                    ? "UI Design"
                    : "Poster Design"}
                </strong>
              </div>

              <div>
                <span>FILE</span>

                <strong>
                  {file?.name || "—"}
                </strong>
              </div>
            </div>

            <div className="review-warning">
              <strong>
                Before you submit
              </strong>

              <p>
                Please make sure your
                details and uploaded
                design are correct. Once
                submitted, you may not
                be able to change your
                submission.
              </p>
            </div>
          </div>
        )}

        <div className="form-actions">
          {step > 1 && (
            <button
              className="secondary-btn"
              type="button"
              onClick={
                previousStep
              }
            >
              ← Back
            </button>
          )}

          {step < 3 ? (
            <button
              className="primary-btn"
              type="button"
              onClick={nextStep}
              disabled={
                roundState !==
                "active"
              }
            >
              Continue{" "}
              <span>→</span>
            </button>
          ) : (
            <button
              className="primary-btn"
              type="button"
              onClick={() =>
                setShowConfirm(
                  true
                )
              }
              disabled={
                roundState !==
                  "active" ||
                submitting
              }
            >
              Final Submit{" "}
              <span>→</span>
            </button>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <button
              className="modal-close"
              onClick={() =>
                setShowConfirm(
                  false
                )
              }
            >
              ×
            </button>

            <span className="modal-icon">
              !
            </span>

            <h3>
              Ready to submit?
            </h3>

            <p>
              Please make sure your
              details and uploaded
              design are correct.
            </p>

            <div className="confirm-note">
              Once submitted, you may
              not be able to change
              your submission.
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() =>
                  setShowConfirm(
                    false
                  )
                }
              >
                Check Again
              </button>

              <button
                className="primary-btn"
                onClick={
                  finalSubmit
                }
                disabled={
                  submitting
                }
              >
                {submitting
                  ? "Submitting..."
                  : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   ADMIN LOGIN
========================================================= */

function AdminLogin({ onLogin }) {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const login = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      alert(
        "Enter email and password."
      );

      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      onLogin();
    } catch (error) {
      console.error(error);

      alert(
        "Invalid admin credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-auth">
      <div className="admin-auth-glow" />

      <form
        className="admin-login-card"
        onSubmit={login}
      >
        <div className="admin-brand">
          <span className="brand-mark">
            A
          </span>

          <div>
            <strong>
              ARTIFY
            </strong>

            <small>
              ADMIN PANEL
            </small>
          </div>
        </div>

        <span className="mini-label">
          SECURE ACCESS
        </span>

        <h1>
          Welcome back.
        </h1>

        <p>
          Sign in to manage rounds,
          submissions and
          qualification.
        </p>

        <Field
          label="Admin Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          placeholder="admin@email.com"
          type="email"
        />

        <Field
          label="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          placeholder="••••••••"
          type="password"
        />

        <button
          className="primary-btn full"
          disabled={loading}
        >
          {loading
            ? "Signing in..."
            : "Sign In"}

          <span>→</span>
        </button>

        <button
          type="button"
          className="back-public"
          onClick={() => {
            window.location.href =
              "/";
          }}
        >
          ← Back to ARTIFY
        </button>
      </form>
    </main>
  );
}

/* =========================================================
   ADMIN SIDEBAR
========================================================= */

function AdminSidebar({
  activePage,
  setActivePage,
  open,
  setOpen,
  onLogout,
}) {
  const items = [
    {
      id: "dashboard",
      icon: "▦",
      label: "Dashboard",
    },
    {
      id: "rounds",
      icon: "◉",
      label: "Round Management",
    },
    {
      id: "submissions",
      icon: "▤",
      label: "Submissions",
    },
    {
      id: "qualified",
      icon: "✓",
      label: "Qualified",
    },
    {
      id: "final",
      icon: "★",
      label: "Final Round",
    },
    {
      id: "exports",
      icon: "⇩",
      label: "CSV Exports",
    },
  ];

  const changePage = (id) => {
    setActivePage(id);
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setOpen(false)
          }
        />
      )}

      <aside
        className={`admin-sidebar ${
          open ? "open" : ""
        }`}
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <span className="brand-mark">
              A
            </span>

            <div>
              <strong>
                ARTIFY
              </strong>

              <small>
                ADMIN
              </small>
            </div>
          </div>

          <button
            className="sidebar-close"
            onClick={() =>
              setOpen(false)
            }
          >
            ×
          </button>
        </div>

        <div className="sidebar-section-label">
          MANAGEMENT
        </div>

        <nav className="sidebar-nav">
          {items.map(
            (item) => (
              <button
                key={item.id}
                className={
                  activePage ===
                  item.id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  changePage(
                    item.id
                  )
                }
              >
                <span className="sidebar-icon">
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>

                {activePage ===
                  item.id && (
                  <b>›</b>
                )}
              </button>
            )
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-status">
            <span className="status-dot" />

            <div>
              <strong>
                Admin Mode
              </strong>

              <small>
                Firebase secured
              </small>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={onLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   ADMIN TOPBAR
========================================================= */

function AdminTopbar({
  title,
  onMenu,
}) {
  return (
    <header className="admin-topbar">
      <button
        className="admin-menu"
        onClick={onMenu}
        aria-label="Open admin menu"
      >
        <span />
        <span />
        <span />
      </button>

      <div>
        <span className="admin-top-label">
          ARTIFY / ADMIN
        </span>

        <h1>{title}</h1>
      </div>

      <div className="admin-top-right">
        <span className="live-indicator">
          <i />
          LIVE
        </span>
      </div>
    </header>
  );
}

/* =========================================================
   STAT
========================================================= */

function Stat({
  number,
  label,
  extra,
}) {
  return (
    <div className="admin-stat">
      <span>{label}</span>

      <strong>{number}</strong>

      {extra && (
        <small>{extra}</small>
      )}
    </div>
  );
}

/* =========================================================
   ROUND FORM
========================================================= */

const emptyRoundForm = {
  name: "",
  theme: "",
  problemStatement: "",
  description: "",
  guidelines: "",
  creativeBrief: [],
  allowedDesignTypes: [
    "ui",
    "poster",
  ],
  enabled: false,
  isFinalRound: false,
  criteria: DEFAULT_CRITERIA,
};

function RoundForm({
  form,
  setForm,
  editingId,
  onSave,
  onCancel,
  saving,
}) {
  const toggleType = (type) => {
    setForm((current) => {
      const exists =
        current.allowedDesignTypes.includes(
          type
        );

      const next = exists
        ? current.allowedDesignTypes.filter(
            (item) =>
              item !== type
          )
        : [
            ...current.allowedDesignTypes,
            type,
          ];

      return {
        ...current,
        allowedDesignTypes:
          next,
      };
    });
  };

  return (
    <div className="round-form-card">
      <div className="panel-heading">
        <div>
          <span className="mini-label">
            {editingId
              ? "EDIT ROUND"
              : "NEW ROUND"}
          </span>

          <h3>
            {editingId
              ? "Update challenge"
              : "Create a new challenge"}
          </h3>
        </div>

        <button
          className="icon-btn"
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
      </div>

      <div className="round-form-grid">
        <label className="form-field">
          <span>
            Round Name / Number
          </span>

          <input
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            placeholder="Round 1"
          />
        </label>

        <label className="form-field">
          <span>Theme</span>

          <input
            value={form.theme}
            onChange={(e) =>
              setForm({
                ...form,
                theme: e.target.value,
              })
            }
            placeholder="Enter round theme"
          />
        </label>

        <label className="form-field full-field">
          <span>
            Problem Statement
          </span>

          <textarea
            value={
              form.problemStatement
            }
            onChange={(e) =>
              setForm({
                ...form,
                problemStatement:
                  e.target.value,
              })
            }
            placeholder="Enter the problem statement..."
          />
        </label>

        <div className="form-field full-field">
          <div className="criteria-editor-header creative-brief-editor-header">
            <div>
              <span>THE CREATIVE BRIEF</span>
              <small>Add the key requirements participants should include in their design.</small>
            </div>
            <button type="button" className="secondary-btn small-btn" onClick={() => setForm({...form, creativeBrief: [...(form.creativeBrief || []), ""]})}>
              + Add Requirement
            </button>
          </div>
          <div className="creative-brief-editor">
            {(form.creativeBrief || []).map((item, index) => (
              <div className="creative-brief-admin-row" key={index}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <input value={item} placeholder="Example: Restaurant name" onChange={(e) => {
                  const creativeBrief = [...(form.creativeBrief || [])];
                  creativeBrief[index] = e.target.value;
                  setForm({...form, creativeBrief});
                }} />
                <button type="button" className="icon-btn danger" onClick={() => setForm({...form, creativeBrief: (form.creativeBrief || []).filter((_, i) => i !== index)})} aria-label="Remove requirement">×</button>
              </div>
            ))}
          </div>
          {(form.creativeBrief || []).length === 0 && (
            <div className="creative-brief-empty">No requirements added yet. Use “+ Add Requirement”.</div>
          )}
        </div>

        <label className="form-field full-field">
          <span>
            Description (Optional)
          </span>

          <textarea
            value={
              form.description
            }
            onChange={(e) =>
              setForm({
                ...form,
                description:
                  e.target.value,
              })
            }
            placeholder="Short description..."
          />
        </label>

        <label className="form-field full-field">
          <span>
            Guidelines
          </span>

          <textarea
            value={
              form.guidelines
            }
            onChange={(e) =>
              setForm({
                ...form,
                guidelines:
                  e.target.value,
              })
            }
            placeholder={
              "Enter one guideline per line\nOriginal work only\nSubmit before deadline"
            }
          />
        </label>

        <div className="form-field">
          <span>
            Allowed Design Types
          </span>

          <div className="admin-type-options">
            <button
              type="button"
              className={
                form.allowedDesignTypes.includes(
                  "ui"
                )
                  ? "selected"
                  : ""
              }
              onClick={() =>
                toggleType("ui")
              }
            >
              UI Design
            </button>

            <button
              type="button"
              className={
                form.allowedDesignTypes.includes(
                  "poster"
                )
                  ? "selected"
                  : ""
              }
              onClick={() =>
                toggleType(
                  "poster"
                )
              }
            >
              Poster Design
            </button>
          </div>
        </div>

<div className="form-field full-field">
          <div className="criteria-editor-header">
            <div>
              <span>
                AI Evaluation Criteria
              </span>

              <small>
                These criteria are sent
                to Gemini for every
                submission in this round.
              </small>
            </div>

            <button
              type="button"
              className="secondary-btn small-btn"
              onClick={() =>
                setForm({
                  ...form,
                  criteria: [
                    ...(form.criteria ||
                      []),
                    {
                      name: "",
                      maxScore: 10,
                      description:
                        "",
                    },
                  ],
                })
              }
            >
              + Add Criterion
            </button>
          </div>

          <div className="criteria-editor">
            {(
              form.criteria || []
            ).map(
              (
                criterion,
                index
              ) => (
                <div
                  className="criteria-row"
                  key={index}
                >
                  <input
                    value={
                      criterion.name
                    }
                    placeholder="Criterion name"
                    onChange={(e) => {
                      const criteria =
                        [
                          ...(form.criteria ||
                            []),
                        ];

                      criteria[
                        index
                      ] = {
                        ...criteria[
                          index
                        ],
                        name:
                          e.target
                            .value,
                      };

                      setForm({
                        ...form,
                        criteria,
                      });
                    }}
                  />

                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={
                      criterion.maxScore
                    }
                    placeholder="Max"
                    onChange={(e) => {
                      const criteria =
                        [
                          ...(form.criteria ||
                            []),
                        ];

                      criteria[
                        index
                      ] = {
                        ...criteria[
                          index
                        ],
                        maxScore:
                          Number(
                            e.target
                              .value
                          ),
                      };

                      setForm({
                        ...form,
                        criteria,
                      });
                    }}
                  />

                  <input
                    value={
                      criterion.description
                    }
                    placeholder="What should Gemini look for?"
                    onChange={(e) => {
                      const criteria =
                        [
                          ...(form.criteria ||
                            []),
                        ];

                      criteria[
                        index
                      ] = {
                        ...criteria[
                          index
                        ],
                        description:
                          e.target
                            .value,
                      };

                      setForm({
                        ...form,
                        criteria,
                      });
                    }}
                  />

                  <button
                    type="button"
                    className="icon-btn danger"
                    disabled={
                      (
                        form.criteria ||
                        []
                      ).length <= 1
                    }
                    onClick={() => {
                      const criteria =
                        (
                          form.criteria ||
                          []
                        ).filter(
                          (_, i) =>
                            i !==
                            index
                        );

                      setForm({
                        ...form,
                        criteria,
                      });
                    }}
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        <div className="round-switches">
          <label className="switch-row">
            <input
              type="checkbox"
              checked={
                form.enabled
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  enabled:
                    e.target
                      .checked,
                })
              }
            />

            <span className="fake-switch" />

            <div>
              <strong>
                Enable Round
              </strong>

              <small>
                Only one round should
                be enabled at a time.
              </small>
            </div>
          </label>

          <label className="switch-row">
            <input
              type="checkbox"
              checked={
                form.isFinalRound
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  isFinalRound:
                    e.target
                      .checked,
                })
              }
            />

            <span className="fake-switch" />

            <div>
              <strong>
                Final Round
              </strong>

              <small>
                Mark this as the final
                stage.
              </small>
            </div>
          </label>
        </div>
      </div>

      <div className="panel-actions">
        <button
          className="secondary-btn"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>

        <button
          className="primary-btn"
          onClick={onSave}
          disabled={saving}
          type="button"
        >
          {saving
            ? "Saving..."
            : "Save Round"}

          <span>→</span>
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   ROUND MANAGEMENT
========================================================= */

function RoundManagement({
  rounds,
}) {
  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState(emptyRoundForm);

  const [saving, setSaving] =
    useState(false);

  const openNew = () => {
    setEditingId(null);

    setForm({
      ...emptyRoundForm,
      criteria:
        DEFAULT_CRITERIA.map(
          (item) => ({
            ...item,
          })
        ),
    });

    setShowForm(true);
  };

  const editRound = (round) => {
    setEditingId(round.id);

    setForm({
      name: round.name || "",
      theme: round.theme || "",
      problemStatement:
        round.problemStatement ||
        "",
      description:
        round.description || "",
      guidelines:
        (
          round.guidelines ||
          []
        ).join("\n"),
      creativeBrief:
        Array.isArray(round.creativeBrief)
          ? round.creativeBrief
          : [],
      allowedDesignTypes:
        round.allowedDesignTypes ||
        ["ui", "poster"],
      enabled:
        !!round.enabled,
      isFinalRound:
        !!round.isFinalRound,
      criteria:
        round.criteria?.length
          ? round.criteria
          : DEFAULT_CRITERIA,
    });

    setShowForm(true);
  };

  const disableOtherRounds =
    async (exceptId) => {
      if (!auth.currentUser) {
        throw new Error(
          "Admin session expired. Please login again."
        );
      }

      const snapshot =
        await getDocs(
          collection(
            db,
            "rounds"
          )
        );

      const updates = [];

      snapshot.forEach(
        (item) => {
          if (
            item.id !==
              exceptId &&
            item.data()
              .enabled
          ) {
            updates.push(
              updateDoc(
                doc(
                  db,
                  "rounds",
                  item.id
                ),
                {
                  enabled:
                    false,
                  updatedAt:
                    serverTimestamp(),
                }
              )
            );
          }
        }
      );

      await Promise.all(
        updates
      );
    };

  const saveRound = async () => {
    if (!form.name.trim()) {
      alert(
        "Enter round name."
      );

      return;
    }

    if (!form.theme.trim()) {
      alert("Enter theme.");
      return;
    }

    if (
      !form.problemStatement.trim()
    ) {
      alert(
        "Enter problem statement."
      );

      return;
    }

if (
      !form.allowedDesignTypes
        .length
    ) {
      alert(
        "Select at least one design type."
      );

      return;
    }

    const criteria = (
      form.criteria || []
    )
      .map((item) => ({
        name: String(
          item.name || ""
        ).trim(),

        maxScore: Number(
          item.maxScore
        ),

        description:
          String(
            item.description ||
              ""
          ).trim(),
      }))
      .filter(
        (item) => item.name
      );

    if (!criteria.length) {
      alert(
        "Add at least one AI evaluation criterion."
      );

      return;
    }

    if (
      criteria.some(
        (item) =>
          !Number.isFinite(
            item.maxScore
          ) ||
          item.maxScore <= 0
      )
    ) {
      alert(
        "Every criterion must have a valid maximum score."
      );

      return;
    }

    const criteriaTotal =
      criteria.reduce(
        (sum, item) =>
          sum + item.maxScore,
        0
      );

    if (criteriaTotal !== 100) {
      alert(
        `AI criteria maximum must total exactly 100. Current total: ${criteriaTotal}.`
      );

      return;
    }

    if (!auth.currentUser) {
      alert(
        "Admin session expired. Please login again."
      );

      return;
    }

    setSaving(true);

    try {
      let roundId =
        editingId;

      if (!roundId) {
        roundId =
          makeRoundId(
            form.name
          );
      }

      if (form.enabled) {
        await disableOtherRounds(
          roundId
        );
      }

      const data = {
        name: form.name.trim(),

        theme: form.theme.trim(),

        problemStatement:
          form.problemStatement.trim(),

        description:
          form.description.trim(),

        guidelines:
          form.guidelines
            .split("\n")
            .map(
              (item) =>
                item.trim()
            )
            .filter(Boolean),

        creativeBrief:
          (form.creativeBrief || [])
            .map((item) => String(item || "").trim())
            .filter(Boolean),

        allowedDesignTypes:
          form.allowedDesignTypes,

        enabled:
          form.enabled,

        isFinalRound:
          form.isFinalRound,

        criteria,

        updatedAt:
          serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(
          doc(
            db,
            "rounds",
            editingId
          ),
          data
        );
      } else {
        await setDoc(
          doc(
            db,
            "rounds",
            roundId
          ),
          {
            ...data,
            createdAt:
              serverTimestamp(),
          }
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm(
        emptyRoundForm
      );
    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to save round."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleRound = async (
    round
  ) => {
    if (!auth.currentUser) {
      alert(
        "Admin session expired. Please login again."
      );

      return;
    }

    try {
      if (!round.enabled) {
        await disableOtherRounds(
          round.id
        );
      }

      await updateDoc(
        doc(
          db,
          "rounds",
          round.id
        ),
        {
          enabled:
            !round.enabled,

          updatedAt:
            serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(error);

      alert(
        "Unable to update round."
      );
    }
  };

  const deleteRound = async (
    round
  ) => {
    if (!auth.currentUser) {
      alert(
        "Admin session expired. Please login again."
      );

      return;
    }

    const okay =
      window.confirm(
        `Delete ${round.name}? This cannot be undone.`
      );

    if (!okay) return;

    try {
      await deleteDoc(
        doc(
          db,
          "rounds",
          round.id
        )
      );
    } catch (error) {
      console.error(error);

      alert(
        "Unable to delete round."
      );
    }
  };

  return (
    <section className="admin-page">
      <div className="page-heading-row">
        <div>
          <span className="mini-label">
            CHALLENGE CONTROL
          </span>

          <h2>
            Round Management
          </h2>

          <p>
            Create and control
            unlimited competition
            rounds.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={openNew}
        >
          + Add New Round
        </button>
      </div>

      {showForm && (
        <RoundForm
          form={form}
          setForm={setForm}
          editingId={editingId}
          onSave={saveRound}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          saving={saving}
        />
      )}

      <div className="round-management-list">
        {rounds.length ===
        0 ? (
          <div className="admin-empty">
            <span>
              NO ROUNDS
            </span>

            <p>
              Create your first
              round using the button
              above.
            </p>
          </div>
        ) : (
          rounds.map(
            (round, index) => {
              const state =
                getRoundState(
                  round
                );

              return (
                <div
                  className={`round-admin-card ${
                    state ===
                    "active"
                      ? "is-active"
                      : ""
                  }`}
                  key={round.id}
                >
                  <div className="round-number">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div className="round-admin-main">
                    <div className="round-admin-title">
                      <div>
                        <span className="mini-label">
                          {round.isFinalRound
                            ? "FINAL ROUND"
                            : "ROUND"}
                        </span>

                        <h3>
                          {round.name}
                        </h3>
                      </div>

                      <span
                        className={`admin-status-pill ${state}`}
                      >
                        {getRoundStateLabel(
                          round
                        )}
                      </span>
                    </div>

                    <div className="round-admin-theme">
                      {
                        round.theme
                      }
                    </div>

                    <div className="round-admin-meta">
                      <span>
                        {(
                          round.allowedDesignTypes ||
                          []
                        )
                          .map(
                            (
                              type
                            ) =>
                              type ===
                              "ui"
                                ? "UI"
                                : "POSTER"
                          )
                          .join(
                            " + "
                          )}
                      </span>
                    </div>
                  </div>

                  <div className="round-admin-actions">
                    <button
                      className={
                        round.enabled
                          ? "round-toggle enabled"
                          : "round-toggle"
                      }
                      onClick={() =>
                        toggleRound(
                          round
                        )
                      }
                    >
                      {round.enabled
                        ? "Disable"
                        : "Enable"}
                    </button>

                    <button
                      className="icon-btn"
                      onClick={() =>
                        editRound(
                          round
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="icon-btn danger"
                      onClick={() =>
                        deleteRound(
                          round
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            }
          )
        )}
      </div>
    </section>
  );
}

/* =========================================================
   RANKING
========================================================= */

function sortSubmissions(
  items,
  sortType
) {
  return [...items].sort(
    (a, b) => {
      const scoreA =
        getScore(a);

      const scoreB =
        getScore(b);

      const marksA =
        typeof scoreA ===
        "number"
          ? scoreA
          : -Infinity;

      const marksB =
        typeof scoreB ===
        "number"
          ? scoreB
          : -Infinity;

      const timeA =
        timestampToMillis(
          a.submittedAt
        ) ||
        timestampToMillis(
          a.submittedAtClient
        );

      const timeB =
        timestampToMillis(
          b.submittedAt
        ) ||
        timestampToMillis(
          b.submittedAtClient
        );

      if (
        sortType ===
        "marks"
      ) {
        if (
          marksB !== marksA
        ) {
          return (
            marksB - marksA
          );
        }

        return timeA - timeB;
      }

      if (
        sortType ===
        "earliest"
      ) {
        return timeA - timeB;
      }

      if (
        sortType ===
        "latest"
      ) {
        return timeB - timeA;
      }

      if (
        sortType ===
        "name"
      ) {
        return (
          a.name || ""
        ).localeCompare(
          b.name || ""
        );
      }

      if (
        sortType ===
        "department"
      ) {
        return (
          a.department || ""
        ).localeCompare(
          b.department || ""
        );
      }

      return 0;
    }
  );
}

/* =========================================================
   SUBMISSIONS TABLE
========================================================= */

function SubmissionsTable({
  submissions,
  rounds,
  onPreview,
}) {
  const [
    roundFilter,
    setRoundFilter,
  ] = useState("all");

  const [
    departmentFilter,
    setDepartmentFilter,
  ] = useState("all");

  const [
    designFilter,
    setDesignFilter,
  ] = useState("all");

  const [search, setSearch] =
    useState("");

  const [
    sortType,
    setSortType,
  ] = useState("marks");

  const [
    evaluatingId,
    setEvaluatingId,
  ] = useState(null);

  const [
    evaluation,
    setEvaluation,
  ] = useState(null);

  /* =====================================================
     AI EVALUATION
  ===================================================== */

  const evaluateWithAI =
    async (submission) => {
      if (!auth.currentUser) {
        alert(
          "Admin session expired. Please login again."
        );

        return;
      }

      if (!submission?.id) {
        alert(
          "Invalid submission."
        );

        return;
      }

      if (!submission?.fileUrl) {
        alert(
          "This submission does not have a design file."
        );

        return;
      }

      setEvaluatingId(
        submission.id
      );

      try {
        /*
         * IMPORTANT:
         * Use the submission's own round ID.
         * This supports multiple rounds.
         */
        const roundId =
          submission.roundId;

        if (!roundId) {
          throw new Error(
            "Submission round ID is missing."
          );
        }

        const roundRef =
          doc(
            db,
            "rounds",
            roundId
          );

        const roundSnapshot =
          await getDoc(
            roundRef
          );

        if (
          !roundSnapshot.exists()
        ) {
          throw new Error(
            `Round not found in Firestore.\n\nRound ID:\n${roundId}`
          );
        }

        const round = {
          id: roundSnapshot.id,
          ...roundSnapshot.data(),
        };

        const criteria =
          Array.isArray(
            round.criteria
          ) &&
          round.criteria.length >
            0
            ? round.criteria
            : DEFAULT_CRITERIA;

        const token =
          await auth.currentUser.getIdToken();

        const response =
          await fetch(
            `${AI_API_URL}/api/evaluate-design`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                submissionId:
                  submission.id,

                // For PDFs, use the Cloudinary JPG preview URL for AI
                // evaluation. This avoids PDF delivery restrictions and lets
                // the AI service analyze the actual visible design.
                fileUrl:
                  submission.aiFileUrl ||
                  submission.fileUrl,

                originalFileUrl:
                  submission.downloadUrl ||
                  submission.fileUrl ||
                  "",

                fileName:
                  submission.aiFileName ||
                  submission.fileName ||
                  "",

                originalFileName:
                  submission.fileName ||
                  "",

                designType:
                  submission.designType ||
                  "",

                participantName:
                  submission.name ||
                  "",

                registerNumber:
                  submission.registerNumber ||
                  "",

                round: {
                  id: round.id,

                  name:
                    round.name ||
                    "",

                  theme:
                    round.theme ||
                    "",

                  problemStatement:
                    round.problemStatement ||
                    "",

                  guidelines:
                    Array.isArray(
                      round.guidelines
                    )
                      ? round.guidelines
                      : [],

                  criteria,

                  requirements:
                    Array.isArray(round.requirements)
                      ? round.requirements
                      : Array.isArray(round.creativeBrief)
                      ? round.creativeBrief.map((item) => ({
                          title: item,
                          value: "",
                          required: true,
                        }))
                      : [],
                },
              }),
            }
          );

        let data;

        try {
          data =
            await response.json();
        } catch {
          throw new Error(
            "AI server returned an invalid response."
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "AI evaluation failed."
          );
        }

        if (
          !data.evaluation ||
          typeof data
            .evaluation
            .totalScore !==
            "number"
        ) {
          throw new Error(
            "Invalid AI evaluation response."
          );
        }

        const submissionRef =
          doc(
            db,
            "submissions",
            submission.id
          );

        await updateDoc(
          submissionRef,
          {
            aiScore:
              data.evaluation
                .totalScore,

            aiEvaluation:
              data.evaluation,

            finalScore:
              data.evaluation
                .totalScore,

            marks:
              data.evaluation
                .totalScore,

            aiEvaluatedAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );

        setEvaluation({
          submission,
          data:
            data.evaluation,
        });
      } catch (error) {
        console.error(
          "AI EVALUATION ERROR:",
          error
        );

        alert(
          error?.message ||
            "Unable to evaluate with AI."
        );
      } finally {
        setEvaluatingId(null);
      }
    };

  /* =====================================================
     VIEW SAVED AI REVIEW
  ===================================================== */

  const viewAIReview = (submission) => {
    if (!submission?.aiEvaluation) {
      alert("AI review is not available for this submission yet.");
      return;
    }

    setEvaluation({
      submission,
      data: submission.aiEvaluation,
    });
  };

  /* =====================================================
     MANUAL MARKS
  ===================================================== */

  const updateMarks = async (
    submission,
    value
  ) => {
    if (!auth.currentUser) {
      alert(
        "Admin session expired. Please login again."
      );

      return;
    }

    const marks =
      value === ""
        ? null
        : Number(value);

    if (
      marks !== null &&
      (!Number.isFinite(
        marks
      ) ||
        marks < 0 ||
        marks > 100)
    ) {
      alert(
        "Marks must be between 0 and 100."
      );

      return;
    }

    try {
      await updateDoc(
        doc(
          db,
          "submissions",
          submission.id
        ),
        {
          marks,

          finalScore: marks,

          updatedAt:
            serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(error);

      alert(
        "Unable to update marks."
      );
    }
  };

  /* =====================================================
     SELECTION
  ===================================================== */

  const updateSelection =
    async (
      submission,
      selected
    ) => {
      if (!auth.currentUser) {
        alert(
          "Admin session expired. Please login again."
        );

        return;
      }

      try {
        await updateDoc(
          doc(
            db,
            "submissions",
            submission.id
          ),
          {
            selected,

            status: selected
              ? "qualified"
              : "not-qualified",

            updatedAt:
              serverTimestamp(),
          }
        );
      } catch (error) {
        console.error(error);

        alert(
          "Unable to update selection."
        );
      }
    };

  /* =====================================================
     FILTERING
  ===================================================== */

  const filtered = useMemo(() => {
    const result =
      submissions.filter(
        (item) => {
          const searchValue =
            search.toLowerCase();

          const matchesSearch =
            !search ||
            item.name
              ?.toLowerCase()
              .includes(
                searchValue
              ) ||
            item.registerNumber
              ?.toLowerCase()
              .includes(
                searchValue
              );

          const matchesRound =
            roundFilter ===
              "all" ||
            item.roundId ===
              roundFilter;

          const matchesDepartment =
            departmentFilter ===
              "all" ||
            item.department ===
              departmentFilter;

          const matchesDesign =
            designFilter ===
              "all" ||
            item.designType ===
              designFilter;

          return (
            matchesSearch &&
            matchesRound &&
            matchesDepartment &&
            matchesDesign
          );
        }
      );

    return sortSubmissions(
      result,
      sortType
    );
  }, [
    submissions,
    search,
    roundFilter,
    departmentFilter,
    designFilter,
    sortType,
  ]);

  return (
    <section className="admin-page">
      <div className="page-heading-row">
        <div>
          <span className="mini-label">
            EVALUATION
          </span>

          <h2>
            Submissions
          </h2>

          <p>
            Review designs, enter
            marks and manually
            qualify participants.
          </p>
        </div>

        <span className="result-count">
          {filtered.length} RESULTS
        </span>
      </div>

      <div className="filters-card">
        <div className="search-box">
          <span>⌕</span>

          <input
            placeholder="Search name or register number..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />
        </div>

        <select
          value={roundFilter}
          onChange={(e) =>
            setRoundFilter(
              e.target.value
            )
          }
        >
          <option value="all">
            All Rounds
          </option>

          {rounds.map(
            (round) => (
              <option
                value={round.id}
                key={round.id}
              >
                {round.name}
              </option>
            )
          )}
        </select>

        <select
          value={
            departmentFilter
          }
          onChange={(e) =>
            setDepartmentFilter(
              e.target.value
            )
          }
        >
          <option value="all">
            All Departments
          </option>

          {DEPARTMENTS.map(
            (department) => (
              <option
                value={department}
                key={department}
              >
                {department}
              </option>
            )
          )}
        </select>

        <select
          value={designFilter}
          onChange={(e) =>
            setDesignFilter(
              e.target.value
            )
          }
        >
          <option value="all">
            All Designs
          </option>

          <option value="ui">
            UI
          </option>

          <option value="poster">
            Poster
          </option>
        </select>

        <select
          value={sortType}
          onChange={(e) =>
            setSortType(
              e.target.value
            )
          }
        >
          <option value="marks">
            Marks ↓
          </option>

          <option value="earliest">
            Submission Earliest
          </option>

          <option value="latest">
            Submission Latest
          </option>

          <option value="name">
            Name A → Z
          </option>

          <option value="department">
            Department
          </option>
        </select>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="submissions-table">
            <thead>
              <tr>
                <th>
                  Participant
                </th>

                <th>
                  Round
                </th>

                <th>
                  Design
                </th>

                <th>
                  Submitted
                </th>

                <th>
                  File
                </th>

                <th>
                  AI Evaluation
                </th>

                <th>
                  Final Marks
                </th>

                <th>
                  Select
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.length ===
              0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="table-empty">
                      No submissions
                      found.
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(
                  (
                    submission
                  ) => (
                    <tr
                      key={
                        submission.id
                      }
                    >
                      <td>
                        <div className="participant-cell">
                          <strong>
                            {
                              submission.name
                            }
                          </strong>

                          <small>
                            {
                              submission.registerNumber
                            }
                          </small>

                          <small>
                            {
                              submission.department
                            }{" "}
                            ·{" "}
                            {
                              submission.year
                            }
                          </small>
                        </div>
                      </td>

                      <td>
                        <span className="table-round">
                          {submission.roundName ||
                            submission.roundId}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`design-badge ${
                            submission.designType
                          }`}
                        >
                          {submission.designType ===
                          "ui"
                            ? "UI"
                            : "POSTER"}
                        </span>
                      </td>

                      <td>
                        <div className="date-cell">
                          <strong>
                            {formatDate(
                              submission.submittedAt ||
                                submission.submittedAtClient
                            )}
                          </strong>

                          <small>
                            {new Date(
                              timestampToMillis(
                                submission.submittedAt ||
                                  submission.submittedAtClient
                              )
                            ).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}
                          </small>
                        </div>
                      </td>

                      <td>
                        <button
                          className="view-file"
                          onClick={() =>
                            onPreview(
                              submission
                            )
                          }
                        >
                          View ↗
                        </button>
                      </td>

                      <td>
                        <button
                          className="ai-evaluate-btn"
                          disabled={
                            evaluatingId ===
                            submission.id
                          }
                          onClick={() =>
                            evaluateWithAI(
                              submission
                            )
                          }
                        >
                          {evaluatingId ===
                          submission.id
                            ? "Evaluating..."
                            : submission.aiScore !=
                              null
                            ? "Re-evaluate AI"
                            : "AI Evaluate"}
                        </button>

                        {submission.aiScore !=
                          null && (
                          <small className="ai-score-label">
                            AI:{" "}
                            {
                              submission.aiScore
                            }
                            /100
                          </small>
                        )}

                        {submission.aiEvaluation && (
                          <button
                            type="button"
                            className="view-ai-review-btn"
                            onClick={() =>
                              viewAIReview(
                                submission
                              )
                            }
                          >
                            View AI Review ↗
                          </button>
                        )}
                      </td>

                      <td>
                        <input
                          className="marks-input"
                          type="number"
                          min="0"
                          max="100"
                          value={
                            getScore(
                              submission
                            ) ?? ""
                          }
                          placeholder="—"
                          onChange={(
                            e
                          ) =>
                            updateMarks(
                              submission,
                              e.target
                                .value
                            )
                          }
                        />
                      </td>

                      <td>
                        <button
                          className={`select-toggle ${
                            submission.selected
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            updateSelection(
                              submission,
                              !submission.selected
                            )
                          }
                        >
                          {submission.selected
                            ? "✓ Selected"
                            : "Select"}
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================
          AI EVALUATION MODAL
      ================================================= */}

      {evaluation && (
        <div
          className="evaluation-modal-backdrop"
          onClick={() =>
            setEvaluation(
              null
            )
          }
        >
          <div
            className="evaluation-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="evaluation-modal-header">
              <div>
                <span className="mini-label">
                  GEMINI AI EVALUATION
                </span>

                <h3>
                  {
                    evaluation
                      .submission
                      .name
                  }
                </h3>

                <p>
                  {
                    evaluation
                      .submission
                      .registerNumber
                  }{" "}
                  ·{" "}
                  {evaluation
                    .submission
                    .designType ===
                  "ui"
                    ? "UI Design"
                    : "Poster Design"}
                </p>
              </div>

              <button
                className="icon-btn"
                onClick={() =>
                  setEvaluation(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="evaluation-total">
              <span>
                AI TOTAL SCORE
              </span>

              <strong>
                {
                  evaluation.data
                    .totalScore
                }
                /100
              </strong>
            </div>

            <div className="evaluation-criteria-list">
              {(
                evaluation.data
                  .criteria || []
              ).map(
                (
                  item,
                  index
                ) => (
                  <div
                    className="evaluation-criterion"
                    key={index}
                  >
                    <div>
                      <strong>
                        {
                          item.name
                        }
                      </strong>

                      <p>
                        {item.reason ||
                          "No explanation provided."}
                      </p>
                    </div>

                    <b>
                      {
                        item.score
                      }
                      /
                      {
                        item.maxScore
                      }
                    </b>
                  </div>
                )
              )}
            </div>

            {evaluation.data
              .overallFeedback && (
              <div className="evaluation-feedback">
                <span className="mini-label">
                  OVERALL FEEDBACK
                </span>

                <p>
                  {
                    evaluation.data
                      .overallFeedback
                  }
                </p>
              </div>
            )}

            <div className="evaluation-modal-footer">
              <button
                className="secondary-btn"
                onClick={() =>
                  setEvaluation(
                    null
                  )
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   QUALIFIED
========================================================= */

function QualifiedPage({
  submissions,
  rounds,
}) {
  const [roundId, setRoundId] =
    useState("all");

  const selected = useMemo(() => {
    const items =
      submissions.filter(
        (item) =>
          item.selected &&
          (roundId ===
            "all" ||
            item.roundId ===
              roundId)
      );

    return sortSubmissions(
      items,
      "marks"
    );
  }, [
    submissions,
    roundId,
  ]);

  return (
    <section className="admin-page">
      <div className="page-heading-row">
        <div>
          <span className="mini-label">
            SHORTLIST
          </span>

          <h2>
            Qualified Participants
          </h2>

          <p>
            Participants manually
            selected by the admin.
          </p>
        </div>

        <select
          className="standalone-select"
          value={roundId}
          onChange={(e) =>
            setRoundId(
              e.target.value
            )
          }
        >
          <option value="all">
            All Rounds
          </option>

          {rounds.map(
            (round) => (
              <option
                value={round.id}
                key={round.id}
              >
                {round.name}
              </option>
            )
          )}
        </select>
      </div>

      <div className="qualified-grid">
        {selected.length ===
        0 ? (
          <div className="admin-empty full">
            <span>
              NO QUALIFIED
              PARTICIPANTS
            </span>

            <p>
              Selected participants
              will appear here.
            </p>
          </div>
        ) : (
          selected.map(
            (item, index) => (
              <div
                className="qualified-card"
                key={item.id}
              >
                <div className="rank">
                  #{index + 1}
                </div>

                <div>
                  <span className="mini-label">
                    {
                      item.roundName
                    }
                  </span>

                  <h3>
                    {item.name}
                  </h3>

                  <p>
                    {
                      item.registerNumber
                    }{" "}
                    ·{" "}
                    {
                      item.department
                    }
                  </p>
                </div>

                <div className="qualified-marks">
                  <strong>
                    {getScore(
                      item
                    ) ?? "—"}
                  </strong>

                  <span>
                    MARKS
                  </span>
                </div>
              </div>
            )
          )
        )}
      </div>
    </section>
  );
}

/* =========================================================
   FINAL ROUND
========================================================= */

function FinalRoundPage({
  rounds,
  submissions,
}) {
  const finalRounds =
    rounds.filter(
      (round) =>
        round.isFinalRound
    );

  const finalists =
    submissions.filter(
      (item) =>
        item.selected &&
        finalRounds.some(
          (round) =>
            round.id ===
            item.roundId
        )
    );

  return (
    <section className="admin-page">
      <div className="page-heading-row">
        <div>
          <span className="mini-label">
            FINAL STAGE
          </span>

          <h2>
            Final Round
          </h2>

          <p>
            Manage final-stage
            rounds and selected
            participants.
          </p>
        </div>
      </div>

      <div className="final-grid">
        <div className="final-panel">
          <span className="mini-label">
            FINAL ROUNDS
          </span>

          <h3>
            {finalRounds.length}
          </h3>

          <p>
            Round(s) marked as
            final.
          </p>

          <div className="final-round-list">
            {finalRounds.length ===
            0 ? (
              <span className="muted">
                No final round
                created yet.
              </span>
            ) : (
              finalRounds.map(
                (round) => (
                  <div
                    key={round.id}
                  >
                    <strong>
                      {round.name}
                    </strong>

                    <span>
                      {getRoundStateLabel(
                        round
                      )}
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </div>

        <div className="final-panel">
          <span className="mini-label">
            FINALISTS
          </span>

          <h3>
            {finalists.length}
          </h3>

          <p>
            Selected participants
            from final rounds.
          </p>

          <div className="final-round-list">
            {finalists
              .slice(0, 8)
              .map(
                (item) => (
                  <div
                    key={item.id}
                  >
                    <strong>
                      {item.name}
                    </strong>

                    <span>
                      {getScore(
                        item
                      ) ?? "—"}{" "}
                      marks
                    </span>
                  </div>
                )
              )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   EXPORTS
========================================================= */

function ExportsPage({
  submissions,
  rounds,
}) {
  const exportAll = (
    round
  ) => {
    const items =
      submissions.filter(
        (item) =>
          item.roundId ===
          round.id
      );

    const rows =
      sortSubmissions(
        items,
        "marks"
      ).map((item) => ({
        Name: item.name,

        "Register Number":
          item.registerNumber,

        Department:
          item.department,

        Year: item.year,

        "File URL":
          item.fileUrl || "",

        Mark:
          getScore(item) ?? "",

        "End Time":
          formatDateTime(
            item.submittedAt ||
              item.submittedAtClient
          ),

        Qualification:
          item.selected
            ? "Qualified"
            : "Not Qualified",
      }));

    downloadCSV(
      `${round.name.replace(
        /\s+/g,
        "-"
      )}-All-Submissions.csv`,
      rows
    );
  };

  const exportQualified = (
    round
  ) => {
    const items =
      submissions.filter(
        (item) =>
          item.roundId ===
            round.id &&
          item.selected
      );

    const sorted =
      sortSubmissions(
        items,
        "marks"
      );

    const rows =
      sorted.map((item) => ({
        Name: item.name,

        "Register Number":
          item.registerNumber,

        Department:
          item.department,

        Year: item.year,

        "File URL":
          item.fileUrl || "",

        Mark:
          getScore(item) ?? "",

        "End Time":
          formatDateTime(
            item.submittedAt ||
              item.submittedAtClient
          ),

        Qualification:
          "Qualified",
      }));

    downloadCSV(
      `${round.name.replace(
        /\s+/g,
        "-"
      )}-Qualified.csv`,
      rows
    );
  };

  return (
    <section className="admin-page">
      <div className="page-heading-row">
        <div>
          <span className="mini-label">
            DATA EXPORT
          </span>

          <h2>
            CSV Exports
          </h2>

          <p>
            Download round-wise
            submission and
            qualification data.
          </p>
        </div>
      </div>

      <div className="export-list">
        {rounds.length ===
        0 ? (
          <div className="admin-empty">
            No rounds available.
          </div>
        ) : (
          rounds.map(
            (round) => {
              const count =
                submissions.filter(
                  (item) =>
                    item.roundId ===
                    round.id
                ).length;

              const qualified =
                submissions.filter(
                  (item) =>
                    item.roundId ===
                      round.id &&
                    item.selected
                ).length;

              return (
                <div
                  className="export-round"
                  key={round.id}
                >
                  <div className="export-round-info">
                    <span className="mini-label">
                      ROUND
                    </span>

                    <h3>
                      {round.name}
                    </h3>

                    <p>
                      {count}{" "}
                      submissions ·{" "}
                      {qualified}{" "}
                      qualified
                    </p>
                  </div>

                  <div className="export-buttons">
                    <button
                      className="secondary-btn"
                      onClick={() =>
                        exportAll(
                          round
                        )
                      }
                    >
                      ↓ All
                      Submissions
                    </button>

                    <button
                      className="primary-btn"
                      onClick={() =>
                        exportQualified(
                          round
                        )
                      }
                    >
                      ↓ Qualified
                    </button>
                  </div>
                </div>
              );
            }
          )
        )}
      </div>
    </section>
  );
}

/* =========================================================
   PREVIEW MODAL
========================================================= */

function PreviewModal({
  submission,
  onClose,
}) {
  const [downloading, setDownloading] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);

  if (!submission) {
    return null;
  }

  const fileName = submission.fileName || "submission";
  const extension = getExtension(fileName);

  const isImage =
    /^(png|jpg|jpeg|webp|gif)$/i.test(extension);

  const isPdf = extension === "pdf";

  const totalPdfPages = Math.max(
    1,
    Number(submission.filePages || 1)
  );

  /*
   * Cloudinary stores PDFs as image assets. Changing the delivery
   * extension from .pdf to .jpg asks Cloudinary to rasterize a page.
   * pg_<n> selects the requested page. This avoids depending on the
   * browser's PDF viewer and also works when direct PDF delivery is
   * blocked on a free Cloudinary account.
   */
  const getPdfPreviewUrl = (page = 1) => {
    if (!submission.fileUrl) return "";

    let url = submission.fileUrl;

    if (/\.pdf([?#].*)?$/i.test(url)) {
      url = url.replace(
        /\.pdf(?=([?#]|$))/i,
        ".jpg"
      );
    } else {
      url = `${url}.jpg`;
    }

    if (url.includes("/image/upload/")) {
      url = url.replace(
        "/image/upload/",
        `/image/upload/pg_${page}/`
      );
    }

    return url;
  };

  const downloadFile = async () => {
    if (!submission.fileUrl) {
      alert("File URL is not available.");
      return;
    }

    setDownloading(true);

    try {
      const cleanRegisterNumber = String(
        submission.registerNumber || "register-number"
      )
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "");

      // For PDFs, use the exact Cloudinary-rendered JPG page used by the preview.
      // Open File and Download therefore behave like normal JPG files.
      let downloadUrl = isPdf
        ? getPdfPreviewUrl(pdfPage)
        : submission.fileUrl;

      if (!downloadUrl) {
        throw new Error("Download URL is not available.");
      }

      const extensionForDownload = isPdf ? "jpg" : extension || "png";
      const downloadName = `${
        cleanRegisterNumber || "file"
      }${isPdf ? `_page_${pdfPage}` : ""}.${extensionForDownload}`;

      // Fetch the rendered asset and create a local Blob URL so the browser
      // performs a real download instead of opening the Cloudinary URL.
      const response = await fetch(downloadUrl, {
        mode: "cors",
        credentials: "omit",
      });

      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = downloadName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("DOWNLOAD ERROR:", error);
      alert(
        isPdf
          ? "PDF page download failed. Please try again."
          : "Unable to download the file. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="preview-modal">
        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="preview-header">
          <div>
            <span className="mini-label">
              SUBMISSION
            </span>

            <h3>{submission.name}</h3>

            <p>
              {submission.registerNumber} · {submission.designType}
            </p>
          </div>

          <div
            className="preview-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <a
              className="secondary-btn"
              href={isPdf ? getPdfPreviewUrl(pdfPage) : submission.fileUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open File ↗
            </a>

            <button
              className="primary-btn"
              type="button"
              onClick={downloadFile}
              disabled={downloading}
            >
              {downloading ? "Downloading..." : "↓ Download"}
            </button>
          </div>
        </div>

        {isPdf && totalPdfPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "10px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              className="secondary-btn"
              type="button"
              disabled={pdfPage <= 1}
              onClick={() =>
                setPdfPage((page) => Math.max(1, page - 1))
              }
            >
              ← Previous
            </button>

            <span>
              Page {pdfPage} of {totalPdfPages}
            </span>

            <button
              className="secondary-btn"
              type="button"
              disabled={pdfPage >= totalPdfPages}
              onClick={() =>
                setPdfPage((page) =>
                  Math.min(totalPdfPages, page + 1)
                )
              }
            >
              Next →
            </button>
          </div>
        )}

        <div
          className="preview-body"
          style={{
            width: "100%",
            height: "calc(100vh - 220px)",
            minHeight: "500px",
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isImage ? (
            <img
              src={submission.fileUrl}
              alt={fileName}
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "100%",
                width: "auto",
                height: "auto",
                margin: "0 auto",
                objectFit: "contain",
              }}
            />
          ) : isPdf ? (
            <div
              style={{
                width: "100%",
                maxWidth: "1000px",
                padding: "24px",
                boxSizing: "border-box",
              }}
            >
              {Array.from(
                { length: totalPdfPages },
                (_, index) => index + 1
              ).map((page) => (
                <div
                  key={`${submission.fileUrl}-page-${page}`}
                  style={{
                    width: "100%",
                    marginBottom: "24px",
                    display: "flex",
                    justifyContent: "center",
                    scrollMarginTop: "20px",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      background: "#fff",
                      borderRadius: "8px",
                      overflow: "hidden",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        color: "#444",
                        background: "#f3f3f3",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      Page {page} of {totalPdfPages}
                    </div>

                    <img
                      src={getPdfPreviewUrl(page)}
                      alt={`${fileName} - page ${page}`}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        margin: "0 auto",
                      }}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        const errorBox =
                          event.currentTarget.nextElementSibling;
                        if (errorBox) {
                          errorBox.style.display = "block";
                        }
                      }}
                    />

                    <div
                      style={{
                        display: "none",
                        textAlign: "center",
                        padding: "30px",
                        color: "#555",
                      }}
                    >
                      Unable to load page {page}.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <iframe
              src={submission.fileUrl}
              title={fileName}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              }}
            />
          )}

        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard({
  user,
}) {
  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    activePage,
    setActivePage,
  ] = useState(
    "dashboard"
  );

  const [rounds, setRounds] =
    useState([]);

  const [
    submissions,
    setSubmissions,
  ] = useState([]);

  const [preview, setPreview] =
    useState(null);

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "rounds"
        ),
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (item) => ({
                id: item.id,
                ...item.data(),
              })
            );

          data.sort(
            (a, b) =>
              timestampToMillis(b.createdAt) -
              timestampToMillis(a.createdAt)
          );

          setRounds(data);
        },
        (error) => {
          console.error(
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "submissions"
        ),
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (item) => ({
                id: item.id,
                ...item.data(),
              })
            );

          setSubmissions(
            data
          );
        },
        (error) => {
          console.error(
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const qualified =
      submissions.filter(
        (item) =>
          item.selected
      ).length;

    const ui =
      submissions.filter(
        (item) =>
          item.designType ===
          "ui"
      ).length;

    const poster =
      submissions.filter(
        (item) =>
          item.designType ===
          "poster"
      ).length;

    const activeRound =
      rounds.find(
        (round) =>
          getRoundState(
            round
          ) === "active"
      );

    return {
      total:
        submissions.length,

      qualified,

      ui,

      poster,

      activeRound,
    };
  }, [
    submissions,
    rounds,
  ]);

  const pageTitle = {
    dashboard:
      "Dashboard",

    rounds:
      "Round Management",

    submissions:
      "Submissions",

    qualified:
      "Qualified Participants",

    final:
      "Final Round",

    exports:
      "CSV Exports",
  }[activePage];

  const renderPage = () => {
    if (
      activePage ===
      "rounds"
    ) {
      return (
        <RoundManagement
          rounds={rounds}
        />
      );
    }

    if (
      activePage ===
      "submissions"
    ) {
      return (
        <SubmissionsTable
          submissions={
            submissions
          }
          rounds={rounds}
          onPreview={
            setPreview
          }
        />
      );
    }

    if (
      activePage ===
      "qualified"
    ) {
      return (
        <QualifiedPage
          submissions={
            submissions
          }
          rounds={rounds}
        />
      );
    }

    if (
      activePage ===
      "final"
    ) {
      return (
        <FinalRoundPage
          rounds={rounds}
          submissions={
            submissions
          }
        />
      );
    }

    if (
      activePage ===
      "exports"
    ) {
      return (
        <ExportsPage
          submissions={
            submissions
          }
          rounds={rounds}
        />
      );
    }

    return (
      <section className="admin-page">
        <div className="dashboard-welcome">
          <div>
            <span className="mini-label">
              CONTROL CENTER
            </span>

            <h2>
              Good to see you,
              Admin.
            </h2>

            <p>
              Manage your ARTIFY
              challenge from one
              place.
            </p>
          </div>

          <div className="dashboard-round-status">
            <span className="status-dot" />

            <div>
              <small>
                ACTIVE ROUND
              </small>

              <strong>
                {stats
                  .activeRound
                  ?.name ||
                  "No active round"}
              </strong>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <Stat
            label="TOTAL SUBMISSIONS"
            number={
              stats.total
            }
          />

          <Stat
            label="UI DESIGNS"
            number={stats.ui}
          />

          <Stat
            label="POSTER DESIGNS"
            number={
              stats.poster
            }
          />

          <Stat
            label="QUALIFIED"
            number={
              stats.qualified
            }
          />
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <span className="mini-label">
                  ROUNDS
                </span>

                <h3>
                  Competition
                  Timeline
                </h3>
              </div>

              <button
                className="text-btn"
                onClick={() =>
                  setActivePage(
                    "rounds"
                  )
                }
              >
                Manage →
              </button>
            </div>

            <div className="timeline">
              {rounds.length ===
              0 ? (
                <div className="timeline-empty">
                  No rounds
                  created.
                </div>
              ) : (
                rounds
                  .slice(0, 6)
                  .map(
                    (
                      round
                    ) => (
                      <div
                        className="timeline-item"
                        key={
                          round.id
                        }
                      >
                        <span
                          className={`timeline-dot ${getRoundState(
                            round
                          )}`}
                        />

                        <div>
                          <strong>
                            {
                              round.name
                            }
                          </strong>

                          <small>
                            {
                              round.theme
                            }
                          </small>
                        </div>

                        <span
                          className={`admin-status-pill ${getRoundState(
                            round
                          )}`}
                        >
                          {getRoundStateLabel(
                            round
                          )}
                        </span>
                      </div>
                    )
                  )
              )}
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <span className="mini-label">
                  QUICK ACTIONS
                </span>

                <h3>
                  Manage
                </h3>
              </div>
            </div>

            <div className="quick-actions">
              <button
                onClick={() =>
                  setActivePage(
                    "rounds"
                  )
                }
              >
                <span>+</span>

                <div>
                  <strong>
                    Add New Round
                  </strong>

                  <small>
                    Create another
                    challenge
                  </small>
                </div>
              </button>

              <button
                onClick={() =>
                  setActivePage(
                    "submissions"
                  )
                }
              >
                <span>▤</span>

                <div>
                  <strong>
                    Review
                    Submissions
                  </strong>

                  <small>
                    Enter marks
                    and select
                  </small>
                </div>
              </button>

              <button
                onClick={() =>
                  setActivePage(
                    "exports"
                  )
                }
              >
                <span>⇩</span>

                <div>
                  <strong>
                    Export CSV
                  </strong>

                  <small>
                    Download
                    round-wise
                    data
                  </small>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="admin-layout">
      <AdminSidebar
        activePage={
          activePage
        }
        setActivePage={
          setActivePage
        }
        open={sidebarOpen}
        setOpen={
          setSidebarOpen
        }
        onLogout={() =>
          signOut(auth)
        }
      />

      <div className="admin-main">
        <AdminTopbar
          title={pageTitle}
          onMenu={() =>
            setSidebarOpen(
              true
            )
          }
        />

        <div className="admin-content">
          {renderPage()}
        </div>

        <footer className="admin-footer">
          <span>
            ARTIFY · DYNAMOZ '26
          </span>

          <span>
            Logged in as{" "}
            {user?.email ||
              "Admin"}
          </span>
        </footer>
      </div>

      <PreviewModal
        submission={preview}
        onClose={() =>
          setPreview(null)
        }
      />
    </div>
  );
}

/* =========================================================
   FOOTER
========================================================= */

function Footer() {
  return (
    <footer className="public-footer">
      <div>
        <strong>
          ARTIFY<span>.</span>
        </strong>

        <p>
          A creative design
          challenge by DYNAMOZ
          '26.
        </p>
      </div>

      <div className="footer-right">
        <span>
          DEPARTMENT OF COMPUTER
          SCIENCE AND ENGINEERING
        </span>

        <span>
          © 2026
        </span>
      </div>
    </footer>
  );
}

/* =========================================================
   PUBLIC SITE
========================================================= */

function PublicSite({
  round,
}) {
  useReveal();

  return (
    <div className="public-site">
      <Navbar />

      <Hero round={round} />


      <Challenge
        round={round}
      />

      <Guidelines
        round={round}
      />

      <SubmissionForm
        round={round}
      />

      <Footer />
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [rounds, setRounds] =
    useState([]);

  const [
    loadingRounds,
    setLoadingRounds,
  ] = useState(true);

  const [user, setUser] =
    useState(undefined);

  const isAdminRoute =
    window.location.pathname ===
      "/admin" ||
    window.location.hash ===
      "#admin";

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          "rounds"
        ),
        (snapshot) => {
          const data =
            snapshot.docs.map(
              (item) => ({
                id: item.id,
                ...item.data(),
              })
            );

          data.sort(
            (a, b) =>
              timestampToMillis(b.createdAt) -
              timestampToMillis(a.createdAt)
          );

          setRounds(data);
          setLoadingRounds(
            false
          );
        },
        (error) => {
          console.error(
            "Rounds error:",
            error
          );

          setLoadingRounds(
            false
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdminRoute) {
      return;
    }

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(
            currentUser || null
          );
        }
      );

    return () =>
      unsubscribe();
  }, [isAdminRoute]);

  const participantRound =
    useMemo(() => {
      const active =
        rounds.find(
          (round) =>
            getRoundState(
              round
            ) === "active"
        );

      if (active) {
        return active;
      }

      const upcoming =
        rounds.find(
          (round) =>
            getRoundState(
              round
            ) === "upcoming"
        );

      return upcoming || null;
    }, [rounds]);

  if (isAdminRoute) {
    if (user === undefined) {
      return (
        <div className="loading-screen">
          <div className="loading-logo">
            A<span>.</span>
          </div>

          <p>
            Loading admin panel...
          </p>
        </div>
      );
    }

    if (!user) {
      return (
        <AdminLogin
          onLogin={() => {
            setUser(
              auth.currentUser
            );
          }}
        />
      );
    }

    return (
      <AdminDashboard
        user={user}
      />
    );
  }

  if (loadingRounds) {
    return (
      <div className="loading-screen public-loading">
        <div className="loading-logo">
          A<span>.</span>
        </div>

        <p>
          Preparing ARTIFY...
        </p>
      </div>
    );
  }

  return (
    <PublicSite
      round={participantRound}
    />
  );
}
