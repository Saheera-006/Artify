import { getScore } from "../../../utils/scores.js";
import { getRoundStateLabel } from "../../../utils/rounds.js";
import React from "react";

export function FinalRoundPage({ rounds, submissions }) {
  const finalRounds = rounds.filter((round) => round.isFinalRound);

  const finalists = submissions.filter(
    (item) =>
      item.selected && finalRounds.some((round) => round.id === item.roundId),
  );

  return (
    <section className="admin-page">
      <div className="page-heading-row">
        <div>
          <span className="mini-label">FINAL STAGE</span>

          <h2>Final Round</h2>

          <p>Manage final-stage rounds and selected participants.</p>
        </div>
      </div>

      <div className="final-grid">
        <div className="final-panel">
          <span className="mini-label">FINAL ROUNDS</span>

          <h3>{finalRounds.length}</h3>

          <p>Round(s) marked as final.</p>

          <div className="final-round-list">
            {finalRounds.length === 0 ? (
              <span className="muted">No final round created yet.</span>
            ) : (
              finalRounds.map((round) => (
                <div key={round.id}>
                  <strong>{round.name}</strong>

                  <span>{getRoundStateLabel(round)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="final-panel">
          <span className="mini-label">FINALISTS</span>

          <h3>{finalists.length}</h3>

          <p>Selected participants from final rounds.</p>

          <div className="final-round-list">
            {finalists.slice(0, 8).map((item) => (
              <div key={item.id}>
                <strong>{item.name}</strong>

                <span>{getScore(item) ?? "—"} marks</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
