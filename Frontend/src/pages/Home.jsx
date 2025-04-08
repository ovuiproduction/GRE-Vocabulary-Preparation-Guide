import { useState, useEffect } from "react";
import {
  FaBook,
  FaChartLine,
  FaTrophy,
  FaCheckCircle,
  FaInfoCircle,
} from "react-icons/fa";
import axios from "axios";
import logoImg from "../Assets/images/logo-image.png";
import { useNavigate } from "react-router-dom";

import "../css/home.css";

export default function Home() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [studyPlans, setStudyPlans] = useState([]);
  const [userData, setUserData] = useState(null);
  const [fetchError, setFetchError] = useState("");

  const navigate = useNavigate();


  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserData(user);
        try {
          const res = await axios.get(`http://localhost:5000/user/${user._id}`);
          if (res.data) {
            setUserData(res.data);
            localStorage.setItem("user", JSON.stringify(res.data)); // keep localStorage up to date
          }
        } catch (err) {
          console.error("Failed to fetch updated user data", err);
        }
      }
    };
  
    fetchUser();
  
    const handleFocus = () => {
      fetchUser();
    };
  
    window.addEventListener("focus", handleFocus);
  
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);
  

  // const handleStartLearning = async () => {
  //   if (!userData.study_plan) {
  //     alert("No study plan selected!");
  //     return;
  //   }
  
  //   try {
  //     const response = await fetch("http://localhost:5000/start-learning", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         userId: userData._id,
  //         studyPlanId: userData.study_plan,
  //       }),
  //     });
  
  //     const data = await response.json();
  //     if (response.ok) {
  //       // Redirect to study page
  //       window.open(`/study-plan/${userData.study_plan}`, "_blank");
  //     } else {
  //       alert(data.error || "Failed to start learning");
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     alert("Something went wrong");
  //   }
  // };
  

  const handleStartLearning = async () => {
    if (!userData.study_plan) {
      alert("No study plan selected!");
      return;
    }
  
    // Only call backend if not started yet
    if (!userData.started_learning) {
      try {
        const response = await fetch("http://localhost:5000/start-learning", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userData._id,
            studyPlanId: userData.study_plan,
          }),
        });
  
        const data = await response.json();
        if (response.ok) {
          // Update localStorage and state
          const updatedUser = { ...userData, started_learning: true };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUserData(updatedUser);
  
          window.open(`/study-plan/${userData.study_plan}`, "_blank");
        } else {
          alert(data.error || "Failed to start learning");
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong");
      }
    } else {
      // Already started, directly navigate
      window.open(`/study-plan/${userData.study_plan}`, "_blank");
    }
  };
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData(user);
          setSelectedPlan(user.study_plan);
        }

        const plansRes = await axios.get(
          "http://localhost:5000/get-study-plans"
        );
        setStudyPlans(plansRes.data.data);
      } catch (err) {
        setFetchError("Failed to load study plans");
      }
    };

    fetchData();
  }, []);

  const handlePlanSelect = async (planId) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      const response = await axios.patch(
        "http://localhost:5000/update-study-plan",
        {
          userId: user._id,
          planId: planId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updatedUser = {
        ...user,
        study_plan: planId,
        daily_goal: response.data.daily_goal,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setSelectedPlan(planId);
    } catch (err) {
      console.error(
        "Plan update failed:",
        err.response?.data?.message || err.message
      );
    }
  };

  const handleLogOut = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="home-logo-container">
          <img src={logoImg} alt="GRE Master" className="home-logo" />
          <span className="home-logo-text">GRE Vocabulary Master</span>
        </div>

        <div className="home-profile-menu">
          <button
            className="home-profile-icon"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="home-profile-circle">
              {userData && (<>{userData.name[0]}</>)}
            </div>
          </button>

          {showDropdown && (
            <div className="home-dropdown-menu">
              <button className="home-dropdown-item">
                <FaBook /> My Study Plan
              </button>
              <button className="home-dropdown-item">
                <FaChartLine /> Progress
              </button>
              <button className="home-dropdown-item">
                <FaTrophy /> Achievements
              </button>
              <button onClick={handleLogOut} className="home-dropdown-item home-logout">Logout</button>
            </div>
          )}
        </div>
      </header>

      {userData && (
        <section className="home-user-status">
          <div className="home-status-card">
            <h3>Welcome , {userData.name}!</h3>
            {userData.study_plan ? (
              <div className="home-current-plan">
                <p>
                  Current Plan:{" "}
                  {studyPlans.find((p) => p._id === userData.study_plan)
                    ?.name || "Unknown Plan"}
                </p>
                <p>Daily Goal: {userData.daily_goal} words/day</p>
                <p>Streak: {userData.streak} days</p>
                <button
                  onClick={handleStartLearning}
                  className="home-start-learning"
                >
                  Start Learning
                </button>
              </div>
            ) : (
              <p className="home-select-prompt">
                Please select a study plan to get started!
              </p>
            )}
          </div>
        </section>
      )}

      {/* Platform Info Section */}
      <section className="home-info-section">
        <div className="home-info-card">
          <div className="home-info-icon">
            <FaBook />
          </div>
          <h3>Structured Learning</h3>
          <p>Daily curated word lists based on GRE</p>
        </div>

        <div className="home-info-card">
          <div className="home-info-icon">
            <FaChartLine />
          </div>
          <h3>Progress Tracking</h3>
          <p>Detailed analytics and retention metrics</p>
        </div>

        <div className="home-info-card">
          <div className="home-info-icon">
            <FaTrophy />
          </div>
          <h3>Achievements</h3>
          <p>Earn badges and climb leaderboards</p>
        </div>
      </section>

      {/* Study Plan Section */}
      <section className="home-studyplan-section">
        <h2>Choose Your Study Plan</h2>
        {fetchError && <>{fetchError}</>}
        <div className="home-plan-grid">
          {studyPlans &&
            studyPlans.map((plan) => (
              <div
                key={plan._id}
                className={`home-plan-card ${
                  selectedPlan === plan._id ? "home-selected" : ""
                }`}
              >
                <div className="home-plan-header">
                  <h3>{plan.name}</h3>
                  <div className="home-plan-badge">
                    <span>{plan.revision_strategy.mode} revision</span>
                  </div>
                </div>

                <div className="home-plan-stats">
                  <div className="home-stat-item">
                    <FaCheckCircle />
                    <span>{plan.duration_days} Days</span>
                  </div>
                  <div className="home-stat-item">
                    <FaBook />
                    <span>{plan.daily_new_words} New Words/Day</span>
                  </div>
                  <div className="home-stat-item">
                    <FaChartLine />
                    <span>{plan.total_words} Total Words</span>
                  </div>
                </div>

                <div className="home-revision-strategy">
                  <h4>Revision Strategy:</h4>
                  <div className="home-strategy-details">
                    <p>
                      <FaInfoCircle /> Min Attempts:{" "}
                      {plan.revision_strategy.rules.min_incorrect_attempts}
                    </p>
                    <p>
                      <FaInfoCircle /> Retention Target:{" "}
                      {plan.revision_strategy.rules.retention_threshold * 100}%
                    </p>
                  </div>
                </div>

                <button
                  onClick={
                    selectedPlan === plan._id
                      ? handleStartLearning
                      : () => handlePlanSelect(plan._id)
                  }
                  className={`home-plan-button ${
                    selectedPlan === plan._id ? "home-current" : ""
                  }`}
                >
                  {selectedPlan === plan._id ? "Start learning" : "Select Plan"}
                </button>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
