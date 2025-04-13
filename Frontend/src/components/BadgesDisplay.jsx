import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiAward, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router";
import "../css/BadgesDisplay.css";

const server_base_url = "https://gre-vocabulary-preparation-guide-server.onrender.com"

const BadgesDisplay = () => {
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [studyPlan, setStudyPlan] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get user data from localStorage
        const storedUser = localStorage.getItem("user");
        if (!storedUser) throw new Error("User not found");

        const user = JSON.parse(storedUser);

        // Fetch all available badges
        const badgesRes = await axios.get(`${server_base_url}/get/badges`);
        setBadges(badgesRes.data);

        // Fetch user's earned badges
        const userRes = await axios.get(
          `${server_base_url}/user/${user._id}`
        );
        setUserBadges(userRes.data.badges || []);
        if (userRes.data.study_plan) {
          const studyPlanRes = await axios.get(
            `${server_base_url}/study-plan/${userRes.data.study_plan}`
          );
          setStudyPlan(studyPlanRes.data);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch badge data", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getBadgeDetails = (badgeId) => {
    const badge = badges.find((b) => b._id === badgeId);
    const userBadge = userBadges.find((ub) => ub.badgeId === badgeId);

    if (!badge || !userBadge) return null;

    return {
      ...badge,
      awardedOn: new Date(userBadge.awardedOn).toLocaleDateString(),
      studyPlanId: userBadge.studyPlanId,
    };
  };

  const handleBadgeClick = (badgeId) => {
    const badgeDetails = getBadgeDetails(badgeId);
    if (badgeDetails) {
      setSelectedBadge(badgeDetails);
      setShowModal(true);
    }
  };

  if (loading) {
    return (
      <div className="badges-container loading">
        <div className="spinner"></div>
        <p>Loading your achievements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="badges-container error">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="badges-container">
      <header className="journey-header">
        <div className="header-content">
          <h1>My Achievements</h1>
          <p className="subtitle">Track your achievements</p>
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-label">Badges Earned</span>
              <span className="stat-number">{userBadges.length}</span>
            </div>
          </div>
        </div>
      </header>
      <div className="learning-journey-routes">
        <p className="route-paths">
          <span>
            <Link to="/home">Home</Link>
          </span>
          <span>/</span>
          <span>Achievements</span>
        </p>
      </div>

      <div className="badges-content-block">
        <h2 className="badges-header">
          <FiAward className="header-icon" />
          Your Achievements
        </h2>
        {userBadges.length === 0 ? (
          <div className="no-badges">
            <p>You haven't earned any badges yet. Keep learning!</p>
          </div>
        ) : (
          <>
            <div className="badges-grid">
              {userBadges.map((userBadge) => {
                const badge = badges.find((b) => b._id === userBadge.badgeId);
                if (!badge) return null;

                return (
                  <div
                    key={userBadge.badgeId}
                    className="badge-item"
                    onClick={() => handleBadgeClick(userBadge.badgeId)}
                  >
                    <div className="badge-icon-container">
                      <img
                        src={badge.icon_url}
                        alt={badge.name}
                        className="badge-icon"
                      />
                    </div>
                    <div className="badge-name">
                      {badge.name}
                      <p className="badge-display-discription">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {/* Badge Detail Modal */}
      {showModal && selectedBadge && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="close-button"
              onClick={() => setShowModal(false)}
            >
              <FiX />
            </button>

            <div className="modal-header">
              <img
                src={selectedBadge.icon_url}
                alt={selectedBadge.name}
                className="modal-badge-icon"
              />
              <h3>{selectedBadge.name}</h3>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <p>{selectedBadge.description}</p>
              </div>

              <div className="detail-row">
                <span className="detail-label">Criteria:</span>
                <p>
                  {selectedBadge.criteria.type === "test_score" &&
                    `Score ${selectedBadge.criteria.threshold} or higher on a test`}
                </p>
              </div>

              <div className="detail-row">
                <span className="detail-label">Earned On:</span>
                <p>{selectedBadge.awardedOn}</p>
              </div>

              <div className="detail-row">
                <span className="detail-label">Study Plan:</span>
                <p>{studyPlan && studyPlan.name}</p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="nav-button"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgesDisplay;
