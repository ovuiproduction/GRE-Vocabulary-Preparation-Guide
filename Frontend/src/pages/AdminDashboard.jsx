import { Link } from "react-router-dom";
import {
  FaBook,
  FaFileWord,
  FaQuestionCircle,
  FaClipboardList,
  FaPlus,
  FaDownload,
  FaMedal,
} from "react-icons/fa";

import "../css/AdminDashboard.css";

const server_base_url = process.env.REACT_APP_SERVER_URL;


import { useState } from "react";
import OverlayView from "../components/OverlayView";
import axios from "axios";

const AdminDashboard = () => {
  const [modalData, setModalData] = useState(null);
  const [modalTitle, setModalTitle] = useState("");

  const handleView = async (type) => {
    let endpointMap = {
      studyplans: "/admin/study-plans",
      words: "/admin/words",
      questions: "/admin/questions",
      tests: "/admin/tests",
      badges: "/admin/badges",
    };

    const res = await axios.get(`${server_base_url}${endpointMap[type]}`);
    setModalData(res.data);
    setModalTitle(type.replace("-", " ").toUpperCase());
  };

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <header className="admin-dashboard-header">
        <h1 className="admin-dashboard-logo-text">
          <span className="admin-dashboard-logo-icon">📚</span>
          GRE Master Admin
        </h1>
      </header>

      {/* Dashboard Cards */}
      <div className="admin-dashboard-grid">
        {/* Study Plan Card */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-header">
            <FaBook className="admin-dashboard-card-icon" />
            <h2>Study Plans</h2>
          </div>
          <div className="admin-dashboard-card-actions">
            <button onClick={() => handleView('studyplans')} className="admin-dashboard-btn admin-dashboard-fetch-btn">
              <FaDownload /> Fetch Plans
            </button>
            <Link
              to="/admin/add-studyplan"
              className="admin-dashboard-btn admin-dashboard-add-btn"
            >
              <FaPlus /> Add New Plan
            </Link>
          </div>
        </div>

        {/* Vocabulary Card */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-header">
            <FaFileWord className="admin-dashboard-card-icon" />
            <h2>Vocabulary</h2>
          </div>
          <div className="admin-dashboard-card-actions">
            <button onClick={() => handleView('words')} className="admin-dashboard-btn admin-dashboard-fetch-btn">
              <FaDownload  /> Fetch Words
            </button>
            <Link
              to="/admin/add-word"
              className="admin-dashboard-btn admin-dashboard-add-btn"
            >
              <FaPlus /> Add New Word
            </Link>
          </div>
        </div>

        {/* Questions Card */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-header">
            <FaQuestionCircle className="admin-dashboard-card-icon" />
            <h2>Practice Questions</h2>
          </div>
          <div className="admin-dashboard-card-actions">
            <button onClick={() => handleView('questions')} className="admin-dashboard-btn admin-dashboard-fetch-btn">
              <FaDownload /> Fetch Questions
            </button>
            <Link
              to="/admin/add-question"
              className="admin-dashboard-btn admin-dashboard-add-btn"
            >
              <FaPlus /> Add Question
            </Link>
          </div>
        </div>

        {/* Tests Card */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-header">
            <FaClipboardList className="admin-dashboard-card-icon" />
            <h2>Assessment Tests</h2>
          </div>
          <div className="admin-dashboard-card-actions">
            <button onClick={() => handleView('tests')} className="admin-dashboard-btn admin-dashboard-fetch-btn">
              <FaDownload /> Fetch Tests
            </button>
            <Link
              to="/admin/add-test"
              className="admin-dashboard-btn admin-dashboard-add-btn"
            >
              <FaPlus /> Create Test
            </Link>
          </div>
        </div>

        {/* Badges Card */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-header">
            <FaMedal className="admin-dashboard-card-icon" />
            <h2>User Badges</h2>
          </div>
          <div className="admin-dashboard-card-actions">
            <button onClick={() => handleView('badges')} className="admin-dashboard-btn admin-dashboard-fetch-btn">
              <FaDownload /> Fetch Badges
            </button>
            <Link
              to="/admin/add-badge"
              className="admin-dashboard-btn admin-dashboard-add-btn"
            >
              <FaPlus /> Add Badge
            </Link>
          </div>
        </div>
      </div>
      {modalData && (
        <OverlayView
          title={modalTitle}
          data={modalData}
          onClose={() => setModalData(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
