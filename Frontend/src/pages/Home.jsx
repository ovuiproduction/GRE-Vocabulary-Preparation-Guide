import { useState, useEffect } from 'react';
import { FaChevronDown, FaBook, FaChartLine, FaTrophy, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import logoImg from '../Assets/images/logo-image.png';

import '../css/home.css';

export default function Home(){
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [studyPlans, setStudyPlans] = useState([]);
  const [userData, setUserData] = useState(null);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user data from localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserData(user);
          setSelectedPlan(user.study_plan);
        }
  
        // Only fetch study plans from backend
        const plansRes = await axios.get('http://localhost:5000/get-study-plans');
        setStudyPlans(plansRes.data.data);
      } catch (err) {
        setFetchError('Failed to load study plans');
      } finally {
      }
    };
  
    fetchData();
  }, []);


  const handlePlanSelect = async (planId) => {
    try {
      // Get user data from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      
      // Update backend
      const response = await axios.patch('http://localhost:5000/users/update-study-plan', {
        userId: user._id,
        planId: planId
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      // Update local state and storage
      const updatedUser = {
        ...user,
        study_plan: planId,
        daily_goal: response.data.daily_goal
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setSelectedPlan(planId);
  
    } catch (err) {
      console.error('Plan update failed:', err.response?.data?.message || err.message);
      // Handle error (show notification, etc.)
    }
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="logo-container">
          <img src={logoImg} alt="GRE Master" className="logo" />
          <span className="logo-text">GRE Vocabulary Master</span>
        </div>
        
        <div className="profile-menu">
          <button 
            className="profile-icon"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="profile-circle">
            {userData ? (
                <>
                {userData.name[0]}
                </>
            ):(
                <>
                <FaChevronDown/>
                </>
            )}

            </div>
          </button>
          
          {showDropdown && (
            <div className="dropdown-menu">
              <button className="dropdown-item">
                <FaBook /> My Study Plan
              </button>
              <button className="dropdown-item">
                <FaChartLine /> Progress
              </button>
              <button className="dropdown-item">
                <FaTrophy /> Achievements
              </button>
              <button className="dropdown-item logout">
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {userData && (
        <section className="user-status">
          <div className="status-card">
            <h3>Welcome Back, {userData.name}!</h3>
            {userData.study_plan ? (
              <div className="current-plan">
                <p>Current Plan: {studyPlans.find(p => p.id === userData.study_plan).title}</p>
                <p>Daily Goal: {userData.daily_goal} words/day</p>
                <p>Streak: {userData.streak} days</p>
              </div>
            ) : (
              <p className="select-prompt">Please select a study plan to get started!</p>
            )}
          </div>
        </section>
      )}

      {/* Platform Info Section */}
      <section className="info-section">
        <div className="info-card">
          <div className="info-icon">
            <FaBook />
          </div>
          <h3>Structured Learning</h3>
          <p>Daily curated word lists based on GRE</p>
        </div>
        
        <div className="info-card">
          <div className="info-icon">
            <FaChartLine />
          </div>
          <h3>Progress Tracking</h3>
          <p>Detailed analytics and retention metrics</p>
        </div>
        
        <div className="info-card">
          <div className="info-icon">
            <FaTrophy />
          </div>
          <h3>Achievements</h3>
          <p>Earn badges and climb leaderboards</p>
        </div>
      </section>

      {/* Study Plan Section */}
      <section className="studyplan-section">
        <h2>Choose Your Study Plan</h2>
        {fetchError && (<>{fetchError}</>)}
        <div className="plan-grid">
          {studyPlans && studyPlans.map((plan) => (
            <div 
              key={plan._id}
              className={`plan-card ${selectedPlan === plan._id ? 'selected' : ''}`}
            >
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-badge">
                  <span>{plan.revision_strategy.mode} revision</span>
                </div>
              </div>
              
              <div className="plan-stats">
                <div className="stat-item">
                  <FaCheckCircle />
                  <span>{plan.duration_days} Days</span>
                </div>
                <div className="stat-item">
                  <FaBook />
                  <span>{plan.daily_new_words} New Words/Day</span>
                </div>
                <div className="stat-item">
                  <FaChartLine />
                  <span>{plan.total_words} Total Words</span>
                </div>
              </div>

              <div className="revision-strategy">
                <h4>Revision Strategy:</h4>
                <div className="strategy-details">
                  <p>
                    <FaInfoCircle /> Min Attempts: {
                      plan.revision_strategy.rules.min_incorrect_attempts
                    }
                  </p>
                  <p>
                    <FaInfoCircle /> Retention Target: {
                      plan.revision_strategy.rules.retention_threshold * 100
                    }%
                  </p>
                </div>
              </div>

              <button 
                className={`plan-button ${selectedPlan === plan._id ? 'current' : ''}`}
                onClick={() => handlePlanSelect(plan._id)}
                disabled={selectedPlan === plan._id}
              >
                {selectedPlan === plan._id ? 'Active Plan' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

      </section>
    </div>
  );
};