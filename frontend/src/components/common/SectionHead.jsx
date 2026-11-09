import React from "react";

export function SectionHead({ number, title, text }) {
  return (
    <div className="section-head reveal">
      <span className="section-number">{number}</span>

      <div>
        <h2>{title}</h2>

        {text && <p>{text}</p>}
      </div>
    </div>
  );
}
