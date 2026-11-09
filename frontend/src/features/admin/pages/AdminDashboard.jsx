import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebase.js";
import { timestampToMillis } from "../../../utils/dates.js";
import { getRoundState, getRoundStateLabel } from "../../../utils/rounds.js";
import { AdminSidebar } from "../components/AdminSidebar.jsx";
import { AdminTopbar } from "../components/AdminTopbar.jsx";
import { Stat } from "../components/Stat.jsx";
import { RoundManagement } from "../../rounds/pages/RoundManagement.jsx";
import { SubmissionsTable } from "../../submissions/components/SubmissionsTable.jsx";
import { QualifiedPage } from "../../results/pages/QualifiedPage.jsx";
import { FinalRoundPage } from "../../results/pages/FinalRoundPage.jsx";
import { ExportsPage } from "../../results/pages/ExportsPage.jsx";
import { PreviewModal } from "../../submissions/components/PreviewModal.jsx";

export function AdminDashboard({ user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activePage, setActivePage] = useState("dashboard");

  const [rounds, setRounds] = useState([]);

  const [submissions, setSubmissions] = useState([]);

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "rounds"),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        data.sort(
          (a, b) =>
            timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt),
        );

        setRounds(data);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "submissions"),
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setSubmissions(data);
      },
      (error) => {
        console.error(error);
      },
    );

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const qualified = submissions.filter((item) => item.selected).length;

    const ui = submissions.filter((item) => item.designType === "ui").length;

    const poster = submissions.filter(
      (item) => item.designType === "poster",
    ).length;

    const activeRound = rounds.find(
      (round) => getRoundState(round) === "active",
    );

    return {
      total: submissions.length,

      qualified,

      ui,

      poster,

      activeRound,
    };
  }, [submissions, rounds]);

  const pageTitle = {
    dashboard: "Dashboard",

    rounds: "Round Management",

    submissions: "Submissions",

    qualified: "Qualified Participants",

    final: "Final Round",

    exports: "CSV Exports",
  }[activePage];

  const renderPage = () => {
    if (activePage === "rounds") {
      return <RoundManagement rounds={rounds} />;
    }

    if (activePage === "submissions") {
      return (
        <SubmissionsTable
          submissions={submissions}
          rounds={rounds}
          onPreview={setPreview}
        />
      );
    }

    if (activePage === "qualified") {
      return <QualifiedPage submissions={submissions} rounds={rounds} />;
    }

    if (activePage === "final") {
      return <FinalRoundPage rounds={rounds} submissions={submissions} />;
    }

    if (activePage === "exports") {
      return <ExportsPage submissions={submissions} rounds={rounds} />;
    }

    return (
      <section className="admin-page">
        <div className="dashboard-welcome">
          <div>
            <span className="mini-label">CONTROL CENTER</span>

            <h2>Good to see you, Admin.</h2>

            <p>Manage your ARTIFY challenge from one place.</p>
          </div>

          <div className="dashboard-round-status">
            <span className="status-dot" />

            <div>
              <small>ACTIVE ROUND</small>

              <strong>{stats.activeRound?.name || "No active round"}</strong>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <Stat label="TOTAL SUBMISSIONS" number={stats.total} />

          <Stat label="UI DESIGNS" number={stats.ui} />

          <Stat label="POSTER DESIGNS" number={stats.poster} />

          <Stat label="QUALIFIED" number={stats.qualified} />
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <span className="mini-label">ROUNDS</span>

                <h3>Competition Timeline</h3>
              </div>

              <button
                className="text-btn"
                onClick={() => setActivePage("rounds")}
              >
                Manage →
              </button>
            </div>

            <div className="timeline">
              {rounds.length === 0 ? (
                <div className="timeline-empty">No rounds created.</div>
              ) : (
                rounds.slice(0, 6).map((round) => (
                  <div className="timeline-item" key={round.id}>
                    <span className={`timeline-dot ${getRoundState(round)}`} />

                    <div>
                      <strong>{round.name}</strong>

                      <small>{round.theme}</small>
                    </div>

                    <span
                      className={`admin-status-pill ${getRoundState(round)}`}
                    >
                      {getRoundStateLabel(round)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <span className="mini-label">QUICK ACTIONS</span>

                <h3>Manage</h3>
              </div>
            </div>

            <div className="quick-actions">
              <button onClick={() => setActivePage("rounds")}>
                <span>+</span>

                <div>
                  <strong>Add New Round</strong>

                  <small>Create another challenge</small>
                </div>
              </button>

              <button onClick={() => setActivePage("submissions")}>
                <span>▤</span>

                <div>
                  <strong>Review Submissions</strong>

                  <small>Enter marks and select</small>
                </div>
              </button>

              <button onClick={() => setActivePage("exports")}>
                <span>⇩</span>

                <div>
                  <strong>Export CSV</strong>

                  <small>Download round-wise data</small>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="admin-layout">
      <AdminSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        onLogout={() => signOut(auth)}
      />

      <div className="admin-main">
        <AdminTopbar title={pageTitle} onMenu={() => setSidebarOpen(true)} />

        <div className="admin-content">{renderPage()}</div>

        <footer className="admin-footer">
          <span>ARTIFY · DYNAMOZ '26</span>

          <span>Logged in as {user?.email || "Admin"}</span>
        </footer>
      </div>

      <PreviewModal submission={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
