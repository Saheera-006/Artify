import React from "react";

export function AdminSidebar({
  activePage,
  setActivePage,
  open,
  setOpen,
  onLogout,
}) {
  const items = [
    {
      id: "dashboard",
      icon: "▦",
      label: "Dashboard",
    },
    {
      id: "rounds",
      icon: "◉",
      label: "Round Management",
    },
    {
      id: "submissions",
      icon: "▤",
      label: "Submissions",
    },
    {
      id: "qualified",
      icon: "✓",
      label: "Qualified",
    },
    {
      id: "final",
      icon: "★",
      label: "Final Round",
    },
    {
      id: "exports",
      icon: "⇩",
      label: "CSV Exports",
    },
  ];

  const changePage = (id) => {
    setActivePage(id);
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <span className="brand-mark">A</span>

            <div>
              <strong>ARTIFY</strong>

              <small>ADMIN</small>
            </div>
          </div>

          <button className="sidebar-close" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>

        <div className="sidebar-section-label">MANAGEMENT</div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <button
              key={item.id}
              className={activePage === item.id ? "active" : ""}
              onClick={() => changePage(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>

              <span>{item.label}</span>

              {activePage === item.id && <b>›</b>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-status">
            <span className="status-dot" />

            <div>
              <strong>Admin Mode</strong>

              <small>Firebase secured</small>
            </div>
          </div>

          <button className="logout-btn" onClick={onLogout}>
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
