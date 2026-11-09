import { getRoundState, getRoundStateLabel } from "../../../utils/rounds.js";
import React from "react";

export function Hero({ round }) {
  const state = getRoundState(round);

  const scrollToSubmit = () => {
    document.getElementById("submit")?.scrollIntoView({
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
              <span className="mini-label">CURRENT CHALLENGE</span>

              <strong>{round.name}</strong>
            </div>

            <span className={`round-pill ${state}`}>
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
          {state === "active" ? "Enter Challenge" : "Submissions Closed"}

          <span>→</span>
        </button>
      </div>

      <div className="hero-bottom">
        <span>DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</span>

        <span>01 — 01</span>
      </div>
    </section>
  );
}
