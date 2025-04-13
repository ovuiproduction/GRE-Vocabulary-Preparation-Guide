import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/AddTestForm.css";

const server_base_url = process.env.SERVER_URL;


const AddTestForm = () => {
  const [studyPlans, setStudyPlans] = useState([]);
  const [selectedStudyPlan, setSelectedStudyPlan] = useState("");
  const [dayIndex, setDayIndex] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [duration, setDuration] = useState(10);
  const [testType, setTestType] = useState("daily");
  const [loading, setLoading] = useState(false);

  const [flag,setFlag] = useState(false);

  useEffect(() => {
    fetchStudyPlans();
  }, []);

  const fetchStudyPlans = async () => {
    try {
      const res = await axios.get(`${server_base_url}/get-study-plans`);
      setStudyPlans(res.data.data);
    } catch (error) {
      console.error("Error fetching study plans:", error);
    }
  };

  const fetchQuestions = async () => {
    if (!selectedStudyPlan || !dayIndex) return;
    try {
      setFlag(true);
      const res = await axios.get(`${server_base_url}/get-questions/study-plan/${selectedStudyPlan}/day/${dayIndex}`);
      setQuestions(res.data.questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudyPlan || !dayIndex || selectedQuestions.length === 0) {
      alert("Please fill all required fields!");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${server_base_url}/admin/add-test`, {
        studyPlanId: selectedStudyPlan,
        day: dayIndex,
        questions: selectedQuestions,
        duration,
        testType,
      });

      alert("Test added successfully!");
      setDayIndex(1);
      setQuestions([]);
      setSelectedQuestions([]);
      setDuration(10);
      setTestType("daily");
    } catch (error) {
      console.error("Error adding test:", error);
    }
    setLoading(false);
  };

  return (
    <div className="admin-panel">
    <h2>Add New Test</h2>
    <form onSubmit={handleTestSubmit} className="admin-form">
      <div className="form-group">
        <label>Study Plan:</label>
        <select
          className="form-input"
          onChange={(e) => setSelectedStudyPlan(e.target.value)}
          value={selectedStudyPlan}
        >
          <option value="">Select Study Plan</option>
          {studyPlans.map((plan) => (
            <option key={plan._id} value={plan._id}>
              {plan.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Day :</label>
        <input
          type="number"
          className="form-input"
          value={dayIndex}
          onChange={(e) => setDayIndex(e.target.value)}
          min="1"
          required
        />
      </div>

      <button
        type="button"
        className="btn-secondary"
        onClick={fetchQuestions}
      >
        Fetch Questions
      </button>
      {!flag && questions.length == 0 && (<>No Questions fetched...</>)}
      {flag && questions.length == 0 && (<>Questions not available for day {dayIndex}</>)}
      {questions.length > 0 && (
        <div className="form-group">
          <label>Select Questions:</label>
          <div className="question-list">
            {questions.map((q) => (
              <label key={q._id} className="question-item">
                <input
                  type="checkbox"
                  value={q._id}
                  checked={selectedQuestions.includes(q._id)}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedQuestions((prev) =>
                      prev.includes(id)
                        ? prev.filter((qId) => qId !== id)
                        : [...prev, id]
                    );
                  }}
                />
                <span>{q.question}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Duration (Minutes):</label>
        <input
          type="number"
          className="form-input"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          min="1"
          required
        />
      </div>

      <div className="form-group">
        <label>Test Type:</label>
        <select
          className="form-input"
          onChange={(e) => setTestType(e.target.value)}
          value={testType}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? "Adding..." : "Add Test"}
      </button>
    </form>
  </div>
);
};

export default AddTestForm;
