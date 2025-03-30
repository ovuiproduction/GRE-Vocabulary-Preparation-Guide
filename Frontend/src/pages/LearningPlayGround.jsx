import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/LearningPlayground.css";

const LearningPlayground = () => {
  const { studyPlanId } = useParams();
  const [studyPlan, setStudyPlan] = useState(null);
  const [words, setWords] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedWord, setSelectedWord] = useState(null);

const [userData, setUserData] = useState(null);
  useEffect(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      }
    }, []);

  const renderContentSection = (title, content) => {
    if (!content || content.length === 0) return null;
    
    return (
      <div className="learning-playground-modal-section">
        <h4>{title}</h4>
        {Array.isArray(content) ? (
          <ul>
            {content.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>{content}</p>
        )}
      </div>
    );
  };

  useEffect(() => {
    axios.get(`http://localhost:5000/study-plan/${studyPlanId}`).then((res) => {
      setStudyPlan(res.data);
      console.log(res.data);
    });
  }, [studyPlanId]);

  useEffect(() => {
    if (studyPlan) {
      axios
        .get(`http://localhost:5000/study-plan/${studyPlanId}/day/${selectedDay}`)
        .then((res) => {
            setWords(res.data.words)
        });
    }
  }, [selectedDay, studyPlan]);

  return (
    <div className="learning-playground-container">
      {/* Header */}
      <header className="learning-playground-header">
        <div className="learning-playground-header-content">
          <h1 className="learning-playground-header-title">{studyPlan?.name || "Study Plan"}</h1>
          <div className="learning-playground-header-stats">
            <div className="learning-playground-stat-item">
              <span className="learning-playground-stat-label">Daily Goal</span>
              <span className="learning-playground-stat-value">{studyPlan?.daily_new_words} words</span>
            </div>
            <div className="learning-playground-stat-item">
              <span className="learning-playground-stat-label">Total Words</span>
              <span className="learning-playground-stat-value">{studyPlan?.total_words} words</span>
            </div>
            <div className="learning-playground-stat-item">
              <span className="learning-playground-stat-label">Current Streak</span>
              <span className="learning-playground-stat-value">{userData?.streak} days</span>
            </div>
          </div>
        </div>
      </header>

      <div className="learning-playground-main-content">
        {/* Left Sidebar - Days Navigation */}
        <nav className="learning-playground-sidebar">
          <div className="learning-playground-sidebar-inner">
            <h3 className="learning-playground-sidebar-title">Course Content</h3>
            <div className="learning-playground-days-list">
              {studyPlan &&
                Array.from({ length: studyPlan.duration_days }, (_, i) => i + 1).map(
                  (day) => (
                    <button
                      key={day}
                      className={`learning-playground-day-item ${day === selectedDay ? 'active' : ''}`}
                      onClick={() => setSelectedDay(day)}
                    >
                      <span className="learning-playground-day-number">Day {day}</span>
                      <span className="learning-playground-day-status"></span>
                    </button>
                  )
                )}
            </div>
          </div>
        </nav>

        {/* Right Content Area */}
        <main className="learning-playground-content">
          <div className="learning-playground-content-header">
            <h2 className="learning-playground-day-title">Day {selectedDay}</h2>
            <span className="learning-playground-word-count">{words.length} words to learn</span>
          </div>

          <div className="learning-playground-word-list">
            {words.map((word) => (
              <div key={word._id} className="learning-playground-word-card">
                <div className="learning-playground-word-content">
                  <h3 className="learning-playground-word-title">{word.word}</h3>
                  <button 
                    className="learning-playground-learn-button"
                    onClick={() => setSelectedWord(word)}
                  >
                    Start Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {selectedWord && (
        <div className="learning-playground-word-modal">
          <div 
            className="learning-playground-modal-overlay" 
            onClick={() => setSelectedWord(null)}
          ></div>
          
          <div className="learning-playground-modal-content">
            <button 
              className="learning-playground-modal-close" 
              onClick={() => setSelectedWord(null)}
            >
              &times;
            </button>

            <h2 className="learning-playground-modal-title">
              {selectedWord.word}
              <span className="learning-playground-word-tier">
                Tier {selectedWord.tier}
              </span>
            </h2>

            <div className="learning-playground-modal-body">
              {renderContentSection("Definition", selectedWord.definition)}
              {renderContentSection("Synonyms", selectedWord.synonyms)}
              {renderContentSection("Antonyms", selectedWord.antonyms)}

              {selectedWord.content?.stories?.length > 0 && (
                <div className="learning-playground-modal-section">
                  <h4>Stories</h4>
                  {selectedWord.content.stories.map((story, index) => (
                    <div key={index} className="learning-playground-story">
                      <p>{story.text}</p>
                      <div className="learning-playground-story-meta">
                        <span>Upvotes: {story.upvotes}</span>
                        <span>By User {story.created_by}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedWord.content?.mnemonics?.length > 0 && (
                <div className="learning-playground-modal-section">
                  <h4>Mnemonics</h4>
                  {selectedWord.content.mnemonics.map((mnemonic, index) => (
                    <div key={index} className="learning-playground-mnemonic">
                      <p>{mnemonic.text}</p>
                      {mnemonic.media_url && (
                        <img 
                          src={mnemonic.media_url} 
                          alt="Mnemonic visual aid" 
                          className="learning-playground-mnemonic-media"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="learning-playground-modal-actions">
                <button 
                  className="learning-playground-complete-button"
                  onClick={() => console.log('Mark as completed')}
                >
                  Mark as Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPlayground;
