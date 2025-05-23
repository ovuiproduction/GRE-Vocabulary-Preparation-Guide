import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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

import Chatbot from "../components/Chatbot";

const server_base_url = process.env.REACT_APP_SERVER_URL;


export default function Home() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [studyPlans, setStudyPlans] = useState([]);
  const [userData, setUserData] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const [currentDay, setCurrentDay] = useState(null);

  const navigate = useNavigate();

  const location = useLocation();
  const user = location.state?.user;

  // useEffect(() => {
  //   const updateStreak = async () => {
  //     if (!user) return;
  //     try {
  //       await axios.put(
  //         `http://localhost:5000/update-streak/${user._id}/${user.study_plan}`
  //       );
  //     } catch (error) {
  //       console.error("Error updating streak:", error);
  //     }
  //   };
  //   updateStreak();
  // }, [user]);
  

  // useEffect(() => {

  //   const fetchUser = async () => {
  //     const storedUser = localStorage.getItem("user");
  //     if (storedUser) {
  //       const user = JSON.parse(storedUser);
  //       setUserData(user);
  //       try {
  //         const res = await axios.get(`${server_base_url}/user/${user._id}`);
  //         let userRes = res.data;
  //         if (res.data) {
  //           setUserData(res.data);
  //           localStorage.setItem("user", JSON.stringify(res.data));
  //           let calculatedDay = 1;
  //           if (userRes.startDate) {
  //             const startDate = new Date(userRes.startDate);
  //             const today = new Date();

  //             startDate.setHours(0, 0, 0, 0);
  //             today.setHours(0, 0, 0, 0);

  //             const timeDiff = today.getTime() - startDate.getTime();
  //             const daysSinceStart =
  //               Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

  //             calculatedDay = Math.max(
  //               1,
  //               Math.min(daysSinceStart, userRes.studyPlanDuration || 30)
  //             );
  //           }
  //           setCurrentDay(calculatedDay);
  //         }
  //       } catch (err) {
  //         console.error("Failed to fetch updated user data", err);
  //       }
  //     }
  //   };

  //   fetchUser();

  //   const handleFocus = () => {
  //     fetchUser();
  //   };

  //   window.addEventListener("focus", handleFocus);

  //   return () => {
  //     window.removeEventListener("focus", handleFocus);
  //   };
  // }, []);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
  
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
  
        // 1. Update streak
        await axios.put(
          `http://localhost:5000/update-streak/${parsedUser._id}/${parsedUser.study_plan}`
        );
  
        // 2. Fetch updated user data
        const res = await axios.get(`${server_base_url}/user/${parsedUser._id}`);
        const userRes = res.data;
  
        if (userRes) {
          setUserData(userRes);
          localStorage.setItem("user", JSON.stringify(userRes));
  
          // 3. Calculate current day
          let calculatedDay = 1;
          if (userRes.startDate) {
            const startDate = new Date(userRes.startDate);
            const today = new Date();
            startDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
  
            const timeDiff = today.getTime() - startDate.getTime();
            const daysSinceStart = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
            calculatedDay = Math.max(
              1,
              Math.min(daysSinceStart, userRes.studyPlanDuration || 30)
            );
          }
  
          setCurrentDay(calculatedDay);
        }
      } catch (error) {
        console.error("Error during streak update or user fetch:", error);
      }
    };
  
    fetchUser();
  
    // Refresh user data on window focus
    const handleFocus = () => {
      fetchUser();
    };
  
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);
  


  const handleStartLearning = async () => {
    if (!userData.study_plan) {
      alert("No study plan selected!");
      return;
    }

    // Only call backend if not started yet
    if (!userData.started_learning) {
      try {
        const response = await fetch(`${server_base_url}/start-learning`, {
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

          window.open(`#/study-plan/${userData.study_plan}`, "_blank");
        } else {
          alert(data.error || "Failed to start learning");
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong");
      }
    } else {
      // Already started, directly navigate
      window.open(`#/study-plan/${userData.study_plan}`, "_blank");
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
          `${server_base_url}/get-study-plans`
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
        `${server_base_url}/update-study-plan`,
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

  const handleNavigateProgress = () => {
    window.open("#/learning-journey" , "_blank");
  };

  const handleNavigateBadges = () => {
    navigate("/user/badges");
  };


  return (
    <div className="home-container">
      <header className="home-header">
        <div className="home-logo-container">
          <img src={logoImg} alt="GRE Master" className="home-logo" />
          <span className="home-logo-text">GRE Vocabulary Master</span>
        </div>

        <Chatbot />

        <div className="home-profile-menu">
          <button
            className="home-profile-icon"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="home-profile-circle">
              {userData && <>{userData.name[0]}</>}
            </div>
          </button>

          {showDropdown && (
            <div className="home-dropdown-menu">
              <button className="home-dropdown-item">
                <FaBook /> My Study Plan
              </button>
              <button
                onClick={handleNavigateProgress}
                className="home-dropdown-item"
              >
                <FaChartLine /> Progress
              </button>
              <button onClick={handleNavigateBadges} className="home-dropdown-item">
                <FaTrophy /> Achievements
              </button>
              <button
                onClick={handleLogOut}
                className="home-dropdown-item home-logout"
              >
                Logout
              </button>
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
                {currentDay && (<p>Current Day : Day - {currentDay}</p>)}
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
