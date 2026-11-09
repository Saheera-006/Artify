import React, { useMemo, useState } from "react";
import { getScore, sortSubmissions } from "../../../utils/scores.js";

export function QualifiedPage({ submissions, rounds }) {
  const [roundId, setRoundId] = useState("all");

  const selected = useMemo(() => {
    const items = submissions.filter(
      (item) =>
        item.selected && (roundId === "all" || item.roundId === roundId),
    );

    return sortSubmissions(items, "marks");
  }, [submissions, roundId]);

  return (
    <section className="admin-page">
      <div className="page-heading-row">
        <div>
          <span className="mini-label">SHORTLIST</span>

          <h2>Qualified Participants</h2>

          <p>Participants manually selected by the admin.</p>
        </div>

        <select
          className="standalone-select"
          value={roundId}
          onChange={(e) => setRoundId(e.target.value)}
        >
          <option value="all">All Rounds</option>

          {rounds.map((round) => (
            <option value={round.id} key={round.id}>
              {round.name}
            </option>
          ))}
        </select>
      </div>

      <div className="qualified-grid">
        {selected.length === 0 ? (
          <div className="admin-empty full">
            <span>NO QUALIFIED PARTICIPANTS</span>

            <p>Selected participants will appear here.</p>
          </div>
        ) : (
          selected.map((item, index) => (
            <div className="qualified-card" key={item.id}>
              <div className="rank">#{index + 1}</div>

              <div>
                <span className="mini-label">{item.roundName}</span>

                <h3>{item.name}</h3>

                <p>
                  {item.registerNumber} · {item.department}
                </p>
              </div>

              <div className="qualified-marks">
                <strong>{getScore(item) ?? "—"}</strong>

                <span>MARKS</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
