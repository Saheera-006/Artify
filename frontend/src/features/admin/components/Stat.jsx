import React from "react";

export function Stat({ number, label, extra }) {
  return (
    <div className="admin-stat">
      <span>{label}</span>

      <strong>{number}</strong>

      {extra && <small>{extra}</small>}
    </div>
  );
}
