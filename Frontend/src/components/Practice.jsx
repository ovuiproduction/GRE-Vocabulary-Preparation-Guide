import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../css/PracticePage.css";

const server_base_url = process.env.REACT_APP_SERVER_URL;

const Practice = () => {
  const { studyPlanId, selectedDay } = useParams();
  const [test, setTest] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [feedback, setFeedback] = useState({}); // to store whether answer was correct or not

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
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

    fetchTestDetails();
  }, [studyPlanId, selectedDay]);

  const handleOptionChange = (questionId, selectedOption) => {
    const question = test.questions.find((q) => q._id === questionId);
    const isCorrect = selectedOption === question.answer;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
    }));

    setFeedback((prev) => ({
      ...prev,
      [questionId]: isCorrect,
    }));
  };

  const currentQuestion = test?.questions[currentQuestionIndex];

  const goToNextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="practicepage-container">
      <header className="practicepage-header">
        <h1>{test?.testType.toUpperCase()} Practice</h1>
        <p className="practicepage-subtitle">Day {selectedDay}</p>
      </header>

      <main className="practicepage-flashcards">
        {currentQuestion && (
          <div key={currentQuestion._id} className="practicepage-flashcard">
            <div className="practicepage-question-header">
              <span className="practicepage-question-number">
                Question {currentQuestionIndex + 1} of {test?.questions.length}
              </span>
              <span className="practicepage-difficulty-badge">
                {currentQuestion.difficulty}
              </span>
            </div>
            <p className="practicepage-question-text">
              {currentQuestion.question}
            </p>

            <div className="practicepage-options-grid">
              {currentQuestion.options.map((option, i) => (
                <label key={i} className="practicepage-option-item">
                  <input
                    type="radio"
                    name={`question-${currentQuestion._id}`}
                    value={option}
                    checked={selectedAnswers[currentQuestion._id] === option}
                    onChange={() =>
                      handleOptionChange(currentQuestion._id, option)
                    }
                    className="practicepage-option-input"
                  />
                  <span className="practicepage-option-text">{option}</span>
                </label>
              ))}
            </div>

            {selectedAnswers[currentQuestion._id] && (
              <div
                className={
                  feedback[currentQuestion._id]
                    ? "practicepage-correct-feedback"
                    : "practicepage-incorrect-feedback"
                }
              >
                {feedback[currentQuestion._id]
                  ? "✅ Correct!"
                  : `❌ Incorrect. Correct answer: ${currentQuestion.answer}`}
              </div>
            )}

            <div className="practicepage-nav-buttons">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="practicepage-nav-btn"
              >
                Previous
              </button>
              <button
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex === test.questions.length - 1}
                className="practicepage-nav-btn"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Practice;

