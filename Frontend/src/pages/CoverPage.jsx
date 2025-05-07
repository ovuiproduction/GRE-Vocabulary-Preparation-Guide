import React, { useState} from "react";
import { Link } from "react-router";
import "../css/CoverPage.css";
import { FaCheck, FaGamepad, FaBrain, FaClipboardCheck } from "react-icons/fa";
import AuthComponents from "../components/AuthComponent";

const { AuthComponentUser } = AuthComponents;

export default function CoverPage() {
  const [showAuthUser, setShowAuthUser] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [featureCards] = useState([
    {
      title: "Gamified Learning",
      icon: <FaGamepad className="coverpage-feature-icon" />,
      points: [
        "Earn XP for every correct answer",
        "Unlock achievement badges",
        "Compete in weekly leaderboards",
        "Progress through 10 difficulty levels",
      ],
    },
    {
      title: "Smart Practice System",
      icon: <FaBrain className="coverpage-feature-icon" />,
      points: [
        "AI-powered spaced repetition",
        "Adaptive difficulty adjustment",
        "Mistake-focused revision",
        "Daily progress analytics",
      ],
    },
    {
      title: "Test-Ready Preparation",
      icon: <FaClipboardCheck className="coverpage-feature-icon" />,
      points: [
        "GRE-style mock tests",
        "Timed practice sessions",
        "Detailed answer explanations",
        "Performance benchmarking",
      ],
    },
  ]);

  return (
    <div className="coverpage-container">
      {showAuthUser && <AuthComponentUser onClose={() => setShowAuthUser(false)} />}
      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
      <div className="coverpage-particles-container"></div>
      <section className="coverpage-hero-section">
        <div className="coverpage-hero-content">
          <h1 className="coverpage-title">
            Master GRE Vocabulary
            <br />
            Level Up Your Score!
          </h1>
          <button
            className="coverpage-cta-button coverpage-ripple"
            onClick={() => setShowAuthUser(true)}
          >
            Start Learning Now <span className="coverpage-cta-arrow">→</span>
          </button>
        </div>
      </section>

      <section className="coverpage-features-section">
        <h2 className="coverpage-features-title">Why Choose Our Platform?</h2>
        <div className="coverpage-features-grid">
          {featureCards.map((card, index) => (
            <div key={index} className="coverpage-feature-card">
              <div className="coverpage-feature-icon-container">
                {card.icon}
              </div>
              <h3 className="coverpage-feature-title">{card.title}</h3>
              <ul className="coverpage-feature-points">
                {card.points.map((point, idx) => (
                  <li key={idx} className="coverpage-feature-point">
                    <FaCheck className="coverpage-check-icon" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <footer className="cover-page-footer">
        <Link  to="/admin">Admin Panel</Link>
      </footer>
    </div>
  );
}
