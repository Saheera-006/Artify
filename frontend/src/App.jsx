import { useAppData } from "./hooks/useAppData.js";
import React, { useMemo } from "react";
import { auth } from "./config/firebase.js";
import { getRoundState } from "./utils/rounds.js";
import { AdminLogin } from "./features/auth/pages/AdminLogin.jsx";
import { AdminDashboard } from "./features/admin/pages/AdminDashboard.jsx";
import { PublicSite } from "./features/public/pages/PublicSite.jsx";

export default function App() {
  const isAdminRoute =
    window.location.pathname === "/admin" || window.location.hash === "#admin";

  const { rounds, loadingRounds, user, setUser } = useAppData(isAdminRoute);

  const participantRound = useMemo(() => {
    const active = rounds.find((round) => getRoundState(round) === "active");

    if (active) {
      return active;
    }

    const upcoming = rounds.find(
      (round) => getRoundState(round) === "upcoming",
    );

    return upcoming || null;
  }, [rounds]);

  if (isAdminRoute) {
    if (user === undefined) {
      return (
        <div className="loading-screen">
          <div className="loading-logo">
            A<span>.</span>
          </div>

          <p>Loading admin panel...</p>
        </div>
      );
    }

    if (!user) {
      return (
        <AdminLogin
          onLogin={() => {
            setUser(auth.currentUser);
          }}
        />
      );
    }

    return <AdminDashboard user={user} />;
  }

  if (loadingRounds) {
    return (
      <div className="loading-screen public-loading">
        <div className="loading-logo">
          A<span>.</span>
        </div>

        <p>Preparing ARTIFY...</p>
      </div>
    );
  }

  return <PublicSite round={participantRound} />;
}
