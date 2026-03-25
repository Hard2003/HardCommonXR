import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero-card">
        <p className="landing-eyebrow">TCXR Cares</p>
        <h1>Preschool Operations Workspace</h1>
        <p className="landing-hero-description">
          Track enrollment, monitor attendance trends, and review learning outcomes by role.
          Use the dashboard for strategy, or jump directly into student and institution rosters.
        </p>

        <div className="landing-actions">
          <Link className="landing-btn landing-btn-primary" to="/dashboard">Open Dashboard</Link>
          <Link className="landing-btn" to="/allStudents">View Students</Link>
          <Link className="landing-btn" to="/institutions">View Institutions</Link>
        </div>
      </section>

      <section className="landing-panels">
        <article className="landing-panel">
          <h2>Administrator View</h2>
          <p>Institution growth, attendance health, and quarterly proficiency trends.</p>
        </article>
        <article className="landing-panel">
          <h2>Teacher View</h2>
          <p>Daily attendance, developmental performance, and quarter-over-quarter progress.</p>
        </article>
      </section>
    </main>
  );
};