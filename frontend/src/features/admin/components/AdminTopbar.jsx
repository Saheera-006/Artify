import React from "react";

export function AdminTopbar({ title, onMenu }) {
  return (
    <header className="admin-topbar">
      <button
        className="admin-menu"
        onClick={onMenu}
        aria-label="Open admin menu"
      >
        <span />
        <span />
        <span />
      </button>

      <div>
        <span className="admin-top-label">ARTIFY / ADMIN</span>

        <h1>{title}</h1>
      </div>

      <div className="admin-top-right">
        <span className="live-indicator">
          <i />
          LIVE
        </span>
      </div>
    </header>
  );
}
