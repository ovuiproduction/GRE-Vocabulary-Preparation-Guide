
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../css/TestPage.css";

const server_base_url = process.env.REACT_APP_SERVER_URL;


const TestPage = () => {
  const { studyPlanId, selectedDay } = useParams();
  const [test, setTest] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showReview, setShowReview] = useState(false); 

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  const fetchTestDetails = async () => {
    try {
      const res = await axios.get(
        `${server_base_url}/get-test/${studyPlanId}/day/${selectedDay}`
      );
      setTest(res.data.test[0]);
    } catch (error) {
      console.error("Error fetching test:", error);
    }
  };

  useEffect(() => {
    fetchTestDetails();
  }, [studyPlanId, selectedDay]);

  const handleOptionChange = (questionId, selectedOption) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length !== test.questions.length) {
      alert("Please attempt all questions before submitting!");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${server_base_url}/submit-test`, {
        userId: userData._id,
        testId: test._id,
        selectedAnswers,
      });

      setResult(res.data);
      setIsSubmitted(true);
      setLoading(false);
    } catch (error) {
      console.error("Error submitting test:", error);
    }
  };

  return (
    <div className="testpage-container">
      <header className="testpage-header">
        <div className="testpage-header-content">
          <h1>{test?.testType.toUpperCase()} TEST</h1>
          <div className="testpage-meta">
            <span>Day {selectedDay}</span>
            <span>⏳ {test?.duration} Minutes</span>
          </div>
        </div>
      </header>

      <main className="testpage-content">
        {test?.questions.map((q, index) => (
          <div key={q._id} className="testpage-question-card">
            <div className="testpage-question-header">
              <span className="testpage-question-number">
                Question {index + 1}
              </span>
              <span className="testpage-difficulty-badge">{q.difficulty}</span>
            </div>
            <p className="testpage-question-text">{q.question}</p>

            <div className="testpage-options-grid">
              {q.options.map((option, i) => (
                <label key={i} className="testpage-option-item">
                  <input
                    type="radio"
                    name={`question-${q._id}`}
                    value={option}
                    onChange={() => handleOptionChange(q._id, option)}
                    className="testpage-option-input"
                  />
                  <span className="testpage-option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </main>

      {!isSubmitted && (
        <div className="test-footer">
          <button
            className="testpage-submit-button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Test"}
          </button>
        </div>
      )}

      {isSubmitted && (
        <div className="testpage-result-overlay">
          <div className="testpage-result-modal">
            <div className="testpage-modal-header">
              <h2>Test Results</h2>
              <button
                className="testpage-close-btn"
                onClick={() => setIsSubmitted(false)}
                aria-label="Close results"
              >
                &times;
              </button>
            </div>

            <div className="testpage-result-content">
              <div className="testpage-score-summary">
                <div className="testpage-score-circle">
                  {result?.score}/{test?.questions.length}
                </div>
                <p className="testpage-score-text">
                  {result?.score >= test?.questions.length / 2
                    ? "Great job! 🎉"
                    : "Keep practicing! 💪"}
                </p>
              </div>

              <div className="testpage-action-buttons">
                <button
                  className="testpage-review-btn"
                  onClick={() => {setIsSubmitted(false),setShowReview(true)}} // Show Review Overlay
                >
                  Review Answers
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReview && (
        <div className="testpage-review-overlay">
          <div className="testpage-review-modal">
            <div className="testpage-modal-header">
              <h2>Review Answers</h2>
              <button
                className="testpage-close-btn"
                onClick={() => setShowReview(false)}
                aria-label="Close review"
              >
                &times;
              </button>
            </div>

            <div className="testpage-review-content">
              {test?.questions.map((q, index) => {
                const userAnswer = selectedAnswers[q._id];
                const correctAnswer = q.answer;

                return (
                  <div key={q._id} className="review-question-card">
                    <p className="review-question">
                      <strong>Q{index + 1}:</strong> {q.question}
                    </p>
                    <p className="review-user-answer">
                      Your Answer:{" "}
                      <span
                        className={
                          userAnswer === correctAnswer
                            ? "correct-answer"
                            : "incorrect-answer"
                        }
                      >
                        {userAnswer || "Not Attempted"}
                      </span>
                    </p>
                    <p className="review-correct-answer">
                      Correct Answer: <span className="correct-answer">{correctAnswer}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPage;
