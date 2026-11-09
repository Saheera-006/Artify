import React, { useState } from "react";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (id) => {
    setMenuOpen(false);

    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <button
          className="brand"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          <span className="brand-mark">A</span>

          <span>
            ARTIFY<span className="brand-dot">.</span>
          </span>
        </button>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <button onClick={() => goTo("challenge")}>Challenge</button>

          <button onClick={() => goTo("guidelines")}>Guidelines</button>

          <button className="nav-submit" onClick={() => goTo("submit")}>
            Submit
          </button>
        </nav>

        <button
          className={`hamburger ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
