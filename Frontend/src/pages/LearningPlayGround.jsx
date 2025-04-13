import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/LearningPlayground.css";

import DailyTestCard from "../components/DailyTestCard";

const server_base_url = process.env.REACT_APP_SERVER_URL;


const LearningPlayground = () => {
  const { studyPlanId } = useParams();
  const [studyPlan, setStudyPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);

  const [learnedWords, setLearnedWords] = useState();
  const [remainingWords, setRemainingWords] = useState();
  const [totalWords, setTotalWords] = useState();

  const handleWordForest = () => {
    if (studyPlanId && selectedDay) {
      window.open(`/study-plan/${studyPlanId}/day/${selectedDay}`);
    }
  };

  const handleDailyPractice = () => {};

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserData(user);
        try {
          const res = await axios.get(`${server_base_url}/user/${user._id}`);
          let userRes = res.data;
          if (res.data) {
            setUserData(res.data);
            localStorage.setItem("user", JSON.stringify(res.data));
            let calculatedDay = 1;
            if (userRes.startDate) {
              const startDate = new Date(userRes.startDate);
              const today = new Date();

              startDate.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);

              const timeDiff = today.getTime() - startDate.getTime();
              const daysSinceStart =
                Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

              calculatedDay = Math.max(
                1,
                Math.min(daysSinceStart, userRes.studyPlanDuration || 30)
              );
            }
            setSelectedDay(calculatedDay);
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

  useEffect(() => {
    const fetchWordStats = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const res = await axios.get(
          `${server_base_url}/word-stats/${user._id}/${user.study_plan}/${selectedDay}`
        );
        setLearnedWords(res.data.learned);
        setRemainingWords(res.data.remaining);
        setTotalWords(res.data.totalWords);
      } catch (err) {
        console.error("Failed to fetch word stats", err);
      }
    };
    fetchWordStats();

    const handleFocus = () => {
      fetchWordStats();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [selectedDay]);

  useEffect(() => {
    axios.get(`${server_base_url}/study-plan/${studyPlanId}`).then((res) => {
      setStudyPlan(res.data);
      console.log(res.data);
    });
  }, [studyPlanId]);

  return (
    <div className="learning-playground-container">
      {/* Header */}
      <header className="learning-playground-header">
        <div className="learning-playground-header-content">
          <h1 className="learning-playground-header-title">
            {studyPlan?.name || "Study Plan"}
          </h1>
          <div className="learning-playground-header-stats">
            <div className="learning-playground-stat-item">
              <span className="learning-playground-stat-label">Daily Goal</span>
              <span className="learning-playground-stat-value">
                {studyPlan?.daily_new_words} words
              </span>
            </div>
            <div className="learning-playground-stat-item">
              <span className="learning-playground-stat-label">
                Total Words
              </span>
              <span className="learning-playground-stat-value">
                {studyPlan?.total_words} words
              </span>
            </div>
            <div className="learning-playground-stat-item">
              <span className="learning-playground-stat-label">
                Current Streak
              </span>
              <span className="learning-playground-stat-value">
                {userData?.streak} days
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="learning-playground-main-content">
        <nav className="learning-playground-sidebar">
          <div className="learning-playground-sidebar-inner">
            <h3 className="learning-playground-sidebar-title">
              Course Content
            </h3>
            <div className="learning-playground-days-list">
              {studyPlan &&
                Array.from(
                  { length: studyPlan.duration_days },
                  (_, i) => i + 1
                ).map((day) => (
                  <button
                    key={day}
                    className={`learning-playground-day-item ${
                      day === selectedDay ? "active" : ""
                    }`}
                    onClick={() => setSelectedDay(day)}
                  >
                    <span className="learning-playground-day-number">
                      Day {day}
                    </span>
                    <span className="learning-playground-day-status"></span>
                  </button>
                ))}
            </div>
          </div>
        </nav>

        {/* Right Content Area */}
        <main className="learning-playground-content">
          <div className="learning-playground-content-header">
            <h2 className="learning-playground-day-title">Day {selectedDay}</h2>
            <span className="learning-playground-word-count">Todays Plan</span>
          </div>

          <div className="learning-playground-word-list">
            <div className="learning-playground-word-list">
              <div className="learning-playground-word-card">
                <div className="learning-playground-word-content">
                  <h3 className="learning-playground-word-title">Words</h3>
                  <p
                  className="learning-playground-percentage">
                    {Math.round((learnedWords / totalWords) * 100) || 0}%
                  </p>

                  <div className="learning-playground-progress-container">
                    <div
                      className="learning-playground-progress-bar"
                      style={{
                        width:
                          totalWords === 0
                            ? "0%"
                            : `${Math.round(
                                (learnedWords / totalWords) * 100
                              )}%`,
                      }}
                    ></div>
                  </div>

                  <button
                    className="learning-playground-learn-button"
                    onClick={handleWordForest}
                  >
                    Start Learning
                  </button>
                </div>
              </div>
            </div>

            <div className="learning-playground-word-card">
              <div className="learning-playground-word-content">
                <h3 className="learning-playground-word-title">Practice</h3>
                <button
                  className="learning-playground-learn-button"
                  onClick={handleDailyPractice}
                >
                  Start Practice
                </button>
              </div>
            </div>
            { userData && selectedDay && studyPlanId && <DailyTestCard userData={userData} selectedDay={selectedDay} studyPlanId={studyPlanId} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LearningPlayground;
