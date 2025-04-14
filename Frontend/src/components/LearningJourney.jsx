import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiBook, FiAward, FiCheckCircle, FiSearch } from "react-icons/fi";
import "../css/LearningJourney.css";
import { Link } from "react-router";

import ProgressLineChart from "./ProgressLineChart";

const server_base_url = process.env.REACT_APP_SERVER_URL;


const LearningJourney = () => {
  const [progressData, setProgressData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [userData, setUserData] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [totalWords, setTotalWords] = useState(0);
  const [completedTests, setCompletedTests] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const safeFetch = async (url, defaultValue) => {
    try {
      const response = await axios.get(url);
      return response.data || defaultValue;
    } catch (err) {
      console.error(`Error fetching from ${url}:`, err);
      return defaultValue;
    }
  };

  // Handle search functionality
  const handleSearch = () => {
    if (!searchInput.trim()) {
      setFilteredData(progressData);
      setIsSearching(false);
      return;
    }

    const input = searchInput.trim();
    setIsSearching(true);

    // Check for range (e.g., "5-10")
    if (input.includes("-")) {
      const [start, end] = input.split("-").map(Number);
      if (
        !isNaN(start) &&
        !isNaN(end) &&
        start > 0 &&
        end <= progressData.length
      ) {
        const filtered = progressData.filter(
          (day) =>
            day.day >= Math.min(start, end) && day.day <= Math.max(start, end)
        );
        setFilteredData(filtered);
        return;
      }
    }

    // Check for single day
    if (!isNaN(input)) {
      const dayNum = parseInt(input);
      if (dayNum > 0 && dayNum <= progressData.length) {
        setFilteredData([progressData[dayNum - 1]]);
        return;
      }
    }

    // If no valid input, show all
    setFilteredData(progressData);
  };

  // Reset search
  const resetSearch = () => {
    setSearchInput("");
    setFilteredData(progressData);
    setIsSearching(false);
  };

  useEffect(() => {
    const fetchUserAndPlan = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData(user);

          const userRes = await safeFetch(
            `${server_base_url}/user/${user._id}`,
            user
          );

          setUserData(userRes);
          localStorage.setItem("user", JSON.stringify(userRes));

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
          setCurrentDay(calculatedDay);

          if (userRes.study_plan) {
            const studyPlanRes = await safeFetch(
              `${server_base_url}/study-plan/${userRes.study_plan}`,
              { duration_days: 30 }
            );
            setStudyPlan(studyPlanRes);
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
        setError("Failed to load user data. Using default values.");
        setUserData({ _id: "default", study_plan: "default", streak: 0 });
        setStudyPlan({ duration_days: 30 });
      }
    };

    fetchUserAndPlan();
  }, []);

 
  useEffect(() => {
   
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        const days = studyPlan.duration_days || 30;

        // Fetch all word stats in one go
        const wordStatsRes = await axios.get(
          `${server_base_url}/all-word-stats/${userData._id}/${userData.study_plan}`
        );

        // Filter out invalid/null day entries
        const wordStatsMap = {};
        (wordStatsRes.data || []).forEach((stat) => {
          if (stat.day && !isNaN(stat.day)) {
            wordStatsMap[stat.day] = stat;
          }
        });

        // Fetch all test progress in one go
        const testProgressRes = await axios.get(
          `${server_base_url}/all-test-progress/${userData._id}/${userData.study_plan}`
        );

        // Create test progress map: day -> data
        const testMap = {};
        (testProgressRes.data || []).forEach((entry) => {
          if (entry.day && !isNaN(entry.day)) {
            testMap[entry.day] = entry;
          }
        });

        const progress = [];
        let wordsTotal = 0;
        let testsCompleted = 0;

        for (let day = 1; day <= days; day++) {
          const wordStat = wordStatsMap[day] || { learned: 0, totalWords: 0 };
          const testStat = testMap[day] || {
            testExists: false,
            attempted: false,
            score: 0,
          };

          const backlog = wordStat.learned < 10 && day < currentDay;

          if (!wordStatsMap[day] && !testMap[day]) continue;

          if (testStat.attempted) testsCompleted++;
          wordsTotal += wordStat.learned;

          progress.push({
            day,
            wordsLearned: wordStat.learned,
            testStatus: testStat.attempted ? "attempted" : "not-attempted",
            testExists: testStat.testExists,
            score: testStat.score || 0,
            backlog,
          });
        }

        setTotalWords(wordsTotal);
        setCompletedTests(testsCompleted);
        setProgressData(progress);
        setFilteredData(progress);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch progress data", err);
        setError("Failed to load progress data. Displaying sample data.");

        const sampleData = Array.from(
          { length: studyPlan.duration_days || 30 },
          (_, i) => ({
            day: i + 1,
            wordsLearned: Math.floor(Math.random() * 20),
            testStatus: i % 3 === 0 ? "attempted" : "not-attempted",
            testExists: i % 3 === 0,
            score: i % 3 === 0 ? Math.floor(Math.random() * 40) + 60 : 0,
            backlog: i % 5 === 0 && i + 1 < currentDay,
          })
        );

        setTotalWords(sampleData.reduce((sum, d) => sum + d.wordsLearned, 0));
        setCompletedTests(
          sampleData.filter((d) => d.testStatus === "attempted").length
        );
        setProgressData(sampleData);
        setFilteredData(sampleData);
        setLoading(false);
      }
    };
    if(userData && userData.study_plan){
      fetchProgressData();
    }
  }, [userData, studyPlan, currentDay]);

  if (loading) {
    return (
      <div className="learning-journey-container loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your learning journey...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="learning-journey-container error-message">
        Error: {error}
      </div>
    );
  }

  if (progressData.length === 0) {
    return (
      <div className="learning-journey-container">
        No progress data available.
      </div>
    );
  }

  const calculateCircleProgress = (wordsLearned) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(wordsLearned / studyPlan.daily_new_words, 1);
    const dashOffset = circumference * (1 - progress);

    return {
      circumference,
      dashOffset,
      progressPercent: Math.round(progress * 100),
    };
  };

  return (
    <div className="learning-journey-container">
      {/* Header Section */}
      <header className="journey-header">
        <div className="header-content">
          <h1>My Learning Journey</h1>
          <p className="subtitle">Track your daily progress and achievements</p>

          <div className="stats-container">
            <div className="stat-card">
              <FiBook className="stat-icon" />
              <div>
                <span className="stat-value">{totalWords}</span>
                <span className="stat-label">Words Learned</span>
              </div>
            </div>

            <div className="stat-card">
              <FiAward className="stat-icon" />
              <div>
                <span className="stat-value">{completedTests}</span>
                <span className="stat-label">Tests Completed</span>
              </div>
            </div>

            <div className="stat-card">
              <FiCheckCircle className="stat-icon" />
              <div>
                <span className="stat-value">{currentDay}</span>
                <span className="stat-label">Current Day</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="learning-journey-routes">
        <p className="route-paths">
          <span><Link to="/home">Home</Link></span>
          <span>/</span>
          <span>LearningJourney</span>
        </p>
      </div>

      {/* Search Bar Section */}
      <div className="search-container">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by day (e.g., 5) or range (e.g., 5-10)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="search-button" onClick={handleSearch}>
            Search
          </button>
          {isSearching && (
            <button className="reset-button" onClick={resetSearch}>
              Reset
            </button>
          )}
        </div>
        {isSearching && (
          <div className="search-results-info">
            Showing {filteredData.length} of {progressData.length} days
          </div>
        )}
      </div>

    

      {/* Main Content */}
      <main className="journey-content">
        {filteredData.length === 0 ? (
          <div className="no-results">
            No days match your search. Try a different day or range.
          </div>
        ) : (
          <>
            <div className="day-cards-grid">
              {filteredData.map((dayData) => {
                const circleProgress = calculateCircleProgress(
                  dayData.wordsLearned
                );
                const isCurrentDay = dayData.day === currentDay;

                return (
                  <div
                    key={dayData.day}
                    className={`day-card ${isCurrentDay ? "current-day" : ""} ${
                      dayData.backlog ? "backlog" : ""
                    }`}
                    // onClick={() => setCurrentDay(dayData.day)}
                  >
                    <div className="day-card-header">
                      <h3 className="day-number">Day {dayData.day}</h3>
                      {dayData.backlog && (
                        <span className="backlog-tag">Behind</span>
                      )}
                      {isCurrentDay && (
                        <span className="current-tag">Today</span>
                      )}
                    </div>

                    <div className="progress-indicator">
                      <svg className="progress-circle" viewBox="0 0 70 70">
                        <circle
                          className="progress-circle-bg"
                          cx="35"
                          cy="35"
                          r="30"
                        />
                        <circle
                          className={`progress-circle-fill ${
                            dayData.backlog ? "backlog-fill" : ""
                          }`}
                          cx="35"
                          cy="35"
                          r="30"
                          strokeDasharray={circleProgress.circumference}
                          strokeDashoffset={circleProgress.dashOffset}
                        />
                      </svg>
                      <div className="progress-percent">
                        {circleProgress.progressPercent}%
                      </div>
                    </div>

                    <div className="day-stats">
                      <div className="words-stat">
                        <span className="stat-value">
                          {dayData.wordsLearned}
                        </span>
                        <span className="stat-label">/20 words</span>
                      </div>

                      <div
                        className={`test-stat ${
                          !dayData.testExists
                            ? "no-test"
                            : dayData.testStatus === "attempted"
                            ? "completed"
                            : "pending"
                        }`}
                      >
                        {dayData.testExists ? (
                          dayData.testStatus === "attempted" ? (
                            <>
                              <span className="score">{dayData.score}%</span>
                              <span className="label">Test score</span>
                            </>
                          ) : (
                            <>
                              <span className="icon">📝</span>
                              <span className="label">Pending</span>
                            </>
                          )
                        ) : (
                          <>
                            <span className="icon">—</span>
                            <span className="label">No test</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
      {progressData && (
        <>
          <h2 className="learning-journey-progress-graph-title">Words Learned</h2>
          <main className="progress-graph">
            {<ProgressLineChart progressData={progressData} />}
          </main>
          </>
      )}
      <footer className="learning-journey-footer">Learn & Grow</footer>
    </div>
  );
};

export default LearningJourney;
