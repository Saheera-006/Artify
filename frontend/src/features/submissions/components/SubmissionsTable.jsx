import { requestDesignEvaluation } from "../../../services/evaluationService.js";
import React, { useMemo, useState } from "react";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../config/firebase.js";
import { DEFAULT_CRITERIA, DEPARTMENTS } from "../../../config/constants.js";
import { getScore, sortSubmissions } from "../../../utils/scores.js";
import { timestampToMillis, formatDate } from "../../../utils/dates.js";

export function SubmissionsTable({ submissions, rounds, onPreview }) {
  const [roundFilter, setRoundFilter] = useState("all");

  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [designFilter, setDesignFilter] = useState("all");

  const [search, setSearch] = useState("");

  const [sortType, setSortType] = useState("marks");

  const [evaluatingId, setEvaluatingId] = useState(null);

  const [evaluation, setEvaluation] = useState(null);

  /* =====================================================
     AI EVALUATION
  ===================================================== */

  const evaluateWithAI = async (submission) => {
    if (!auth.currentUser) {
      alert("Admin session expired. Please login again.");

      return;
    }

    if (!submission?.id) {
      alert("Invalid submission.");

      return;
    }

    if (!submission?.fileUrl) {
      alert("This submission does not have a design file.");

      return;
    }

    setEvaluatingId(submission.id);

    try {
      /*
       * IMPORTANT:
       * Use the submission's own round ID.
       * This supports multiple rounds.
       */
      const roundId = submission.roundId;

      if (!roundId) {
        throw new Error("Submission round ID is missing.");
      }

      const roundRef = doc(db, "rounds", roundId);

      const roundSnapshot = await getDoc(roundRef);

      if (!roundSnapshot.exists()) {
        throw new Error(
          `Round not found in Firestore.\n\nRound ID:\n${roundId}`,
        );
      }

      const round = {
        id: roundSnapshot.id,
        ...roundSnapshot.data(),
      };

      const criteria =
        Array.isArray(round.criteria) && round.criteria.length > 0
          ? round.criteria
          : DEFAULT_CRITERIA;

      const token = await auth.currentUser.getIdToken();

      const response = await requestDesignEvaluation(token, {
        submissionId: submission.id,

        // For PDFs, use the Cloudinary JPG preview URL for AI
        // evaluation. This avoids PDF delivery restrictions and lets
        // the AI service analyze the actual visible design.
        fileUrl: submission.aiFileUrl || submission.fileUrl,

        originalFileUrl: submission.downloadUrl || submission.fileUrl || "",

        fileName: submission.aiFileName || submission.fileName || "",

        originalFileName: submission.fileName || "",

        designType: submission.designType || "",

        participantName: submission.name || "",

        registerNumber: submission.registerNumber || "",

        round: {
          id: round.id,

          name: round.name || "",

          theme: round.theme || "",

          problemStatement: round.problemStatement || "",

          guidelines: Array.isArray(round.guidelines) ? round.guidelines : [],

          criteria,

          requirements: Array.isArray(round.requirements)
            ? round.requirements
            : Array.isArray(round.creativeBrief)
              ? round.creativeBrief.map((item) => ({
                  title: item,
                  value: "",
                  required: true,
                }))
              : [],
        },
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("AI server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data?.error || "AI evaluation failed.");
      }

      if (!data.evaluation || typeof data.evaluation.totalScore !== "number") {
        throw new Error("Invalid AI evaluation response.");
      }

      const submissionRef = doc(db, "submissions", submission.id);

      await updateDoc(submissionRef, {
        aiScore: data.evaluation.totalScore,

        aiEvaluation: data.evaluation,

        finalScore: data.evaluation.totalScore,

        marks: data.evaluation.totalScore,

        aiEvaluatedAt: serverTimestamp(),

        updatedAt: serverTimestamp(),
      });

      setEvaluation({
        submission,
        data: data.evaluation,
      });
    } catch (error) {
      console.error("AI EVALUATION ERROR:", error);

      alert(error?.message || "Unable to evaluate with AI.");
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

  const updateMarks = async (submission, value) => {
    if (!auth.currentUser) {
      alert("Admin session expired. Please login again.");

      return;
    }

    const marks = value === "" ? null : Number(value);

    if (
      marks !== null &&
      (!Number.isFinite(marks) || marks < 0 || marks > 100)
    ) {
      alert("Marks must be between 0 and 100.");

      return;
    }

    try {
      await updateDoc(doc(db, "submissions", submission.id), {
        marks,

        finalScore: marks,

        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);

      alert("Unable to update marks.");
    }
  };

  /* =====================================================
     SELECTION
  ===================================================== */

  const updateSelection = async (submission, selected) => {
    if (!auth.currentUser) {
      alert("Admin session expired. Please login again.");

      return;
    }

    try {
      await updateDoc(doc(db, "submissions", submission.id), {
        selected,

        status: selected ? "qualified" : "not-qualified",

        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);

      alert("Unable to update selection.");
    }
  };

  /* =====================================================
     FILTERING
  ===================================================== */

  const filtered = useMemo(() => {
    const result = submissions.filter((item) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        !search ||
        item.name?.toLowerCase().includes(searchValue) ||
        item.registerNumber?.toLowerCase().includes(searchValue);

      const matchesRound =
        roundFilter === "all" || item.roundId === roundFilter;

      const matchesDepartment =
        departmentFilter === "all" || item.department === departmentFilter;

      const matchesDesign =
        designFilter === "all" || item.designType === designFilter;

      return (
        matchesSearch && matchesRound && matchesDepartment && matchesDesign
      );
    });

    return sortSubmissions(result, sortType);
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
          <span className="mini-label">EVALUATION</span>

          <h2>Submissions</h2>

          <p>Review designs, enter marks and manually qualify participants.</p>
        </div>

        <span className="result-count">{filtered.length} RESULTS</span>
      </div>

      <div className="filters-card">
        <div className="search-box">
          <span>⌕</span>

          <input
            placeholder="Search name or register number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={roundFilter}
          onChange={(e) => setRoundFilter(e.target.value)}
        >
          <option value="all">All Rounds</option>

          {rounds.map((round) => (
            <option value={round.id} key={round.id}>
              {round.name}
            </option>
          ))}
        </select>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="all">All Departments</option>

          {DEPARTMENTS.map((department) => (
            <option value={department} key={department}>
              {department}
            </option>
          ))}
        </select>

        <select
          value={designFilter}
          onChange={(e) => setDesignFilter(e.target.value)}
        >
          <option value="all">All Designs</option>

          <option value="ui">UI</option>

          <option value="poster">Poster</option>
        </select>

        <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
          <option value="marks">Marks ↓</option>

          <option value="earliest">Submission Earliest</option>

          <option value="latest">Submission Latest</option>

          <option value="name">Name A → Z</option>

          <option value="department">Department</option>
        </select>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Participant</th>

                <th>Round</th>

                <th>Design</th>

                <th>Submitted</th>

                <th>File</th>

                <th>AI Evaluation</th>

                <th>Final Marks</th>

                <th>Select</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="table-empty">No submissions found.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      <div className="participant-cell">
                        <strong>{submission.name}</strong>

                        <small>{submission.registerNumber}</small>

                        <small>
                          {submission.department} · {submission.year}
                        </small>
                      </div>
                    </td>

                    <td>
                      <span className="table-round">
                        {submission.roundName || submission.roundId}
                      </span>
                    </td>

                    <td>
                      <span className={`design-badge ${submission.designType}`}>
                        {submission.designType === "ui" ? "UI" : "POSTER"}
                      </span>
                    </td>

                    <td>
                      <div className="date-cell">
                        <strong>
                          {formatDate(
                            submission.submittedAt ||
                              submission.submittedAtClient,
                          )}
                        </strong>

                        <small>
                          {new Date(
                            timestampToMillis(
                              submission.submittedAt ||
                                submission.submittedAtClient,
                            ),
                          ).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </div>
                    </td>

                    <td>
                      <button
                        className="view-file"
                        onClick={() => onPreview(submission)}
                      >
                        View ↗
                      </button>
                    </td>

                    <td>
                      <button
                        className="ai-evaluate-btn"
                        disabled={evaluatingId === submission.id}
                        onClick={() => evaluateWithAI(submission)}
                      >
                        {evaluatingId === submission.id
                          ? "Evaluating..."
                          : submission.aiScore != null
                            ? "Re-evaluate AI"
                            : "AI Evaluate"}
                      </button>

                      {submission.aiScore != null && (
                        <small className="ai-score-label">
                          AI: {submission.aiScore}
                          /100
                        </small>
                      )}

                      {submission.aiEvaluation && (
                        <button
                          type="button"
                          className="view-ai-review-btn"
                          onClick={() => viewAIReview(submission)}
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
                        value={getScore(submission) ?? ""}
                        placeholder="—"
                        onChange={(e) =>
                          updateMarks(submission, e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <button
                        className={`select-toggle ${
                          submission.selected ? "selected" : ""
                        }`}
                        onClick={() =>
                          updateSelection(submission, !submission.selected)
                        }
                      >
                        {submission.selected ? "✓ Selected" : "Select"}
                      </button>
                    </td>
                  </tr>
                ))
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
          onClick={() => setEvaluation(null)}
        >
          <div
            className="evaluation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="evaluation-modal-header">
              <div>
                <span className="mini-label">GEMINI AI EVALUATION</span>

                <h3>{evaluation.submission.name}</h3>

                <p>
                  {evaluation.submission.registerNumber} ·{" "}
                  {evaluation.submission.designType === "ui"
                    ? "UI Design"
                    : "Poster Design"}
                </p>
              </div>

              <button className="icon-btn" onClick={() => setEvaluation(null)}>
                ×
              </button>
            </div>

            <div className="evaluation-total">
              <span>AI TOTAL SCORE</span>

              <strong>
                {evaluation.data.totalScore}
                /100
              </strong>
            </div>

            <div className="evaluation-criteria-list">
              {(evaluation.data.criteria || []).map((item, index) => (
                <div className="evaluation-criterion" key={index}>
                  <div>
                    <strong>{item.name}</strong>

                    <p>{item.reason || "No explanation provided."}</p>
                  </div>

                  <b>
                    {item.score}/{item.maxScore}
                  </b>
                </div>
              ))}
            </div>

            {evaluation.data.overallFeedback && (
              <div className="evaluation-feedback">
                <span className="mini-label">OVERALL FEEDBACK</span>

                <p>{evaluation.data.overallFeedback}</p>
              </div>
            )}

            <div className="evaluation-modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setEvaluation(null)}
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
