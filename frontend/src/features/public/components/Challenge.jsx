import { getRoundState, getRoundStateLabel } from "../../../utils/rounds.js";
import { SectionHead } from "../../../components/common/SectionHead.jsx";
import React from "react";

export function Challenge({ round }) {
  if (!round) {
    return (
      <section id="challenge" className="section">
        <SectionHead
          number="02"
          title="THE CHALLENGE"
          text="The next challenge will appear here."
        />

        <div className="empty-card reveal">
          <span>NO ACTIVE CHALLENGE</span>

          <p>Stay tuned. The next round will be available soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="challenge" className="section challenge-section">
      <SectionHead
        number="02"
        title={round.name}
        text={round.description || "Your creative challenge starts here."}
      />

      <div className="challenge-card reveal">
        <div className="challenge-top">
          <div>
            <span className="mini-label">THEME</span>

            <h3>{round.theme || "—"}</h3>
          </div>

          <span className={`round-pill ${getRoundState(round)}`}>
            {getRoundStateLabel(round)}
          </span>
        </div>

        <div className="challenge-problem">
          <span className="mini-label">PROBLEM STATEMENT</span>

          <p>
            {round.problemStatement ||
              "Create a design that communicates your idea clearly and creatively."}
          </p>
        </div>

        {Array.isArray(round.creativeBrief) &&
          round.creativeBrief.filter(Boolean).length > 0 && (
            <div className="creative-brief-card reveal">
              <div className="creative-brief-heading">
                <div>
                  <span className="mini-label">THE CREATIVE BRIEF</span>
                  <h3>
                    Key elements your design should communicate or include.
                  </h3>
                </div>
                <span className="creative-brief-mark">✦</span>
              </div>
              <div className="creative-brief-grid">
                {round.creativeBrief.filter(Boolean).map((item, index) => (
                  <div className="creative-brief-item" key={`${item}-${index}`}>
                    <span className="creative-brief-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
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
              {(round.allowedDesignTypes || [])
                .map((type) => (type === "ui" ? "UI Design" : "Poster Design"))
                .join(" / ") || "—"}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
