import { SectionHead } from "../../../components/common/SectionHead.jsx";
import React from "react";

export function Guidelines({ round }) {
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
    <section id="guidelines" className="section guidelines-section">
      <SectionHead
        number="03"
        title="GUIDELINES"
        text="Read before you submit."
      />

      <div className="guideline-list reveal">
        {guidelines.map((item, index) => (
          <div className="guideline-row" key={index}>
            <span>{String(index + 1).padStart(2, "0")}</span>

            <p>{item}</p>

            <b>↗</b>
          </div>
        ))}
      </div>
    </section>
  );
}
