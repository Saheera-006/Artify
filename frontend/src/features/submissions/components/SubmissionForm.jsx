import { uploadToCloudinary } from "../../../services/cloudinaryService.js";
import React, { useState } from "react";
import { doc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../../../config/firebase.js";
import { DEPARTMENTS, YEARS } from "../../../config/constants.js";
import { getRoundState } from "../../../utils/rounds.js";
import { getExtension, isValidRegisterNumber } from "../../../utils/files.js";
import { SectionHead } from "../../../components/common/SectionHead.jsx";
import { FileUploader } from "./FileUploader.jsx";
import { Field } from "../../../components/common/Field.jsx";

export function SubmissionForm({ round }) {
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");

  const [registerNumber, setRegisterNumber] = useState("");

  const [department, setDepartment] = useState("");

  const [year, setYear] = useState("");

  const [designType, setDesignType] = useState("");

  const [file, setFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const [success, setSuccess] = useState(false);

  const allowedTypes = round?.allowedDesignTypes || ["ui", "poster"];

  const roundState = getRoundState(round);

  const validateDetails = () => {
    if (!name.trim()) {
      alert("Please enter your name.");
      return false;
    }

    if (!isValidRegisterNumber(registerNumber)) {
      alert("Register Number must contain exactly 12 digits.");
      return false;
    }

    if (!department) {
      alert("Please select your department.");
      return false;
    }

    if (!year) {
      alert("Please select your year.");
      return false;
    }

    return true;
  };

  const validateDesign = () => {
    if (!designType) {
      alert("Please choose UI Design or Poster Design.");
      return false;
    }

    if (!file) {
      alert("Please upload your design.");
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateDetails()) {
      return;
    }

    if (step === 2 && !validateDesign()) {
      return;
    }

    setStep((current) => Math.min(current + 1, 3));
  };

  const previousStep = () => {
    setStep((current) => Math.max(current - 1, 1));
  };

  const finalSubmit = async () => {
    if (!round || submitting) {
      return;
    }

    if (getRoundState(round) !== "active") {
      alert("This round is no longer open.");

      setShowConfirm(false);

      return;
    }

    if (!file) {
      alert("Please upload your design.");

      return;
    }

    setSubmitting(true);

    const clickTime = Date.now();

    try {
      const submissionId = `${round.id}_${registerNumber}`;

      const submissionRef = doc(db, "submissions", submissionId);

      const cloudinaryResult = await uploadToCloudinary(
        file,
        registerNumber,
        round,
      );

      if (!cloudinaryResult?.secure_url) {
        throw new Error("Design upload failed. Please try again.");
      }

      const extension = getExtension(file.name);

      // AI evaluates a JPG/PNG representation. For PDFs, Cloudinary's image
      // delivery can rasterize page 1 as JPG, so the AI service receives an
      // actual image URL instead of a PDF URL that may be blocked for delivery.
      let aiFileUrl = cloudinaryResult.secure_url;

      let aiFileName = `${registerNumber}.${extension}`;

      if (extension === "pdf") {
        aiFileUrl = cloudinaryResult.secure_url
          .replace("/image/upload/", "/image/upload/pg_1/")
          .replace(/\.pdf(?=([?#]|$))/i, ".jpg");

        aiFileName = `${registerNumber}.jpg`;
      }

      await setDoc(submissionRef, {
        roundId: round.id,
        roundName: round.name || "",
        name: name.trim(),
        registerNumber: registerNumber.trim(),
        department,
        year,
        designType,

        fileName: `${registerNumber}.${extension}`,

        // fileUrl remains the preview asset. For PDFs this is an image
        // resource so page previews work without the browser PDF viewer.
        fileUrl: cloudinaryResult.previewUrl || cloudinaryResult.secure_url,

        // Original download asset. PDFs use a RAW Cloudinary asset; images
        // use their normal image delivery URL.
        downloadUrl:
          cloudinaryResult.downloadUrl || cloudinaryResult.secure_url,

        // AI should analyze the preview image for PDFs, not the blocked
        // original PDF delivery URL.
        aiFileUrl,

        aiFileName,

        filePublicId: cloudinaryResult.public_id || "",

        fileResourceType: cloudinaryResult.resource_type || "image",

        downloadResourceType: cloudinaryResult.downloadResourceType || "image",

        fileFormat: cloudinaryResult.format || extension,

        filePages: Number(cloudinaryResult.pages || 1),

        submittedAt: serverTimestamp(),

        submittedAtClient: Timestamp.fromMillis(clickTime),

        marks: null,
        aiScore: null,
        aiEvaluation: null,
        finalScore: null,

        status: "submitted",
        selected: false,

        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setShowConfirm(false);
    } catch (error) {
      console.error("SUBMISSION ERROR:", error);

      let message = "Something went wrong while submitting. Please try again.";

      if (
        error?.code === "permission-denied" ||
        error?.message?.includes("Missing or insufficient permissions")
      ) {
        message =
          "Unable to submit right now. Please check your details and try again.";
      } else if (error?.message?.includes("Cloudinary")) {
        message = "Unable to upload your design. Please try again.";
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
      <section id="submit" className="section">
        <SectionHead
          number="04"
          title="SUBMIT"
          text="Submission is currently unavailable."
        />

        <div className="empty-card">
          <span>WAIT FOR THE NEXT ROUND</span>

          <p>A new challenge will appear here once it is enabled.</p>
        </div>
      </section>
    );
  }

  if (success) {
    return (
      <section id="submit" className="section submit-section">
        <div className="success-card reveal visible">
          <div className="success-mark">✓</div>

          <span className="mini-label">SUBMISSION RECEIVED</span>

          <h2>You're in.</h2>

          <p>
            Your {designType === "ui" ? "UI" : "Poster"} Design has been
            successfully submitted for <strong>{round.name}</strong>.
          </p>

          <div className="success-register">{registerNumber}</div>

          <small>Please keep your register number for future reference.</small>
        </div>
      </section>
    );
  }

  return (
    <section id="submit" className="section submit-section">
      <SectionHead
        number="04"
        title="SUBMIT YOUR DESIGN"
        text="Simple. Fast. One final submission."
      />

      <div className="submission-card reveal">
        <div className="stepper">
          {[1, 2, 3].map((item) => (
            <div className={`step ${step >= item ? "active" : ""}`} key={item}>
              <span>{item}</span>

              <small>
                {item === 1 ? "Details" : item === 2 ? "Design" : "Review"}
              </small>
            </div>
          ))}
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
                <h3>Your details</h3>

                <p>Enter your participant information.</p>
              </div>
            </div>

            <div className="form-grid">
              <Field
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />

              <Field
                label="Register Number"
                value={registerNumber}
                onChange={(e) =>
                  setRegisterNumber(
                    e.target.value.replace(/\D/g, "").slice(0, 12),
                  )
                }
                placeholder="12 digit register number"
              />

              <Field
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">Select department</option>

                  {DEPARTMENTS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Select year</option>

                  {YEARS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
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
                <h3>Choose your design</h3>

                <p>Select one design category and upload your final work.</p>
              </div>
            </div>

            <div className="design-options">
              {allowedTypes.includes("ui") && (
                <button
                  type="button"
                  className={`design-option ${
                    designType === "ui" ? "selected" : ""
                  }`}
                  onClick={() => setDesignType("ui")}
                >
                  <span>UI</span>

                  <strong>UI Design</strong>

                  <small>Interface / Web Design</small>

                  <b>{designType === "ui" ? "✓" : "○"}</b>
                </button>
              )}

              {allowedTypes.includes("poster") && (
                <button
                  type="button"
                  className={`design-option ${
                    designType === "poster" ? "selected" : ""
                  }`}
                  onClick={() => setDesignType("poster")}
                >
                  <span>POST</span>

                  <strong>Poster Design</strong>

                  <small>Creative Visual Poster</small>

                  <b>{designType === "poster" ? "✓" : "○"}</b>
                </button>
              )}
            </div>

            <FileUploader
              file={file}
              setFile={setFile}
              disabled={roundState !== "active"}
            />
          </div>
        )}

        {step === 3 && (
          <div className="form-section">
            <div className="form-heading">
              <span>03</span>

              <div>
                <h3>Review</h3>

                <p>Check everything before final submission.</p>
              </div>
            </div>

            <div className="review-grid">
              <div>
                <span>NAME</span>
                <strong>{name}</strong>
              </div>

              <div>
                <span>REGISTER NUMBER</span>

                <strong>{registerNumber}</strong>
              </div>

              <div>
                <span>DEPARTMENT</span>

                <strong>{department}</strong>
              </div>

              <div>
                <span>YEAR</span>

                <strong>{year}</strong>
              </div>

              <div>
                <span>DESIGN TYPE</span>

                <strong>
                  {designType === "ui" ? "UI Design" : "Poster Design"}
                </strong>
              </div>

              <div>
                <span>FILE</span>

                <strong>{file?.name || "—"}</strong>
              </div>
            </div>

            <div className="review-warning">
              <strong>Before you submit</strong>

              <p>
                Please make sure your details and uploaded design are correct.
                Once submitted, you may not be able to change your submission.
              </p>
            </div>
          </div>
        )}

        <div className="form-actions">
          {step > 1 && (
            <button
              className="secondary-btn"
              type="button"
              onClick={previousStep}
            >
              ← Back
            </button>
          )}

          {step < 3 ? (
            <button
              className="primary-btn"
              type="button"
              onClick={nextStep}
              disabled={roundState !== "active"}
            >
              Continue <span>→</span>
            </button>
          ) : (
            <button
              className="primary-btn"
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={roundState !== "active" || submitting}
            >
              Final Submit <span>→</span>
            </button>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="modal-backdrop">
          <div className="confirm-modal">
            <button
              className="modal-close"
              onClick={() => setShowConfirm(false)}
            >
              ×
            </button>

            <span className="modal-icon">!</span>

            <h3>Ready to submit?</h3>

            <p>
              Please make sure your details and uploaded design are correct.
            </p>

            <div className="confirm-note">
              Once submitted, you may not be able to change your submission.
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setShowConfirm(false)}
              >
                Check Again
              </button>

              <button
                className="primary-btn"
                onClick={finalSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
