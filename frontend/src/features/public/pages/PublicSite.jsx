import { useReveal } from "../../../hooks/useReveal.js";
import { Navbar } from "../../../components/layout/Navbar.jsx";
import { Hero } from "../components/Hero.jsx";
import { Challenge } from "../components/Challenge.jsx";
import { Guidelines } from "../components/Guidelines.jsx";
import { SubmissionForm } from "../../submissions/components/SubmissionForm.jsx";
import { Footer } from "../../../components/layout/Footer.jsx";
import React from "react";

export function PublicSite({ round }) {
  useReveal();

  return (
    <div className="public-site">
      <Navbar />

      <Hero round={round} />

      <Challenge round={round} />

      <Guidelines round={round} />

      <SubmissionForm round={round} />

      <Footer />
    </div>
  );
}
