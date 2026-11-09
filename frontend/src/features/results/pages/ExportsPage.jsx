import { getScore, sortSubmissions } from "../../../utils/scores.js";
import { formatDateTime } from "../../../utils/dates.js";
import { downloadCSV } from "../../../utils/files.js";
import React from "react";

export function ExportsPage({ submissions, rounds }) {
  const exportAll = (round) => {
    const items = submissions.filter((item) => item.roundId === round.id);

    const rows = sortSubmissions(items, "marks").map((item) => ({
      Name: item.name,

      "Register Number": item.registerNumber,

      Department: item.department,

      Year: item.year,

      "File URL": item.fileUrl || "",

      Mark: getScore(item) ?? "",

      "End Time": formatDateTime(item.submittedAt || item.submittedAtClient),

      Qualification: item.selected ? "Qualified" : "Not Qualified",
    }));

    downloadCSV(`${round.name.replace(/\s+/g, "-")}-All-Submissions.csv`, rows);
  };

  const exportQualified = (round) => {
    const items = submissions.filter(
      (item) => item.roundId === round.id && item.selected,
    );

    const sorted = sortSubmissions(items, "marks");

    const rows = sorted.map((item) => ({
      Name: item.name,

      "Register Number": item.registerNumber,

      Department: item.department,

      Year: item.year,

      "File URL": item.fileUrl || "",

      Mark: getScore(item) ?? "",

      "End Time": formatDateTime(item.submittedAt || item.submittedAtClient),

      Qualification: "Qualified",
    }));

    downloadCSV(`${round.name.replace(/\s+/g, "-")}-Qualified.csv`, rows);
  };

  return (
    <section className="admin-page">
      <div className="page-heading-row">
        <div>
          <span className="mini-label">DATA EXPORT</span>

          <h2>CSV Exports</h2>

          <p>Download round-wise submission and qualification data.</p>
        </div>
      </div>

      <div className="export-list">
        {rounds.length === 0 ? (
          <div className="admin-empty">No rounds available.</div>
        ) : (
          rounds.map((round) => {
            const count = submissions.filter(
              (item) => item.roundId === round.id,
            ).length;

            const qualified = submissions.filter(
              (item) => item.roundId === round.id && item.selected,
            ).length;

            return (
              <div className="export-round" key={round.id}>
                <div className="export-round-info">
                  <span className="mini-label">ROUND</span>

                  <h3>{round.name}</h3>

                  <p>
                    {count} submissions · {qualified} qualified
                  </p>
                </div>

                <div className="export-buttons">
                  <button
                    className="secondary-btn"
                    onClick={() => exportAll(round)}
                  >
                    ↓ All Submissions
                  </button>

                  <button
                    className="primary-btn"
                    onClick={() => exportQualified(round)}
                  >
                    ↓ Qualified
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
