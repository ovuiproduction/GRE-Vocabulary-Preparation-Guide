import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/AddQuestionForm.css";

const server_base_url = process.env.SERVER_URL;

const AddQuestionForm = () => {
  const [studyPlans, setStudyPlans] = useState([]);
  const [selectedStudyPlan, setSelectedStudyPlan] = useState("");
  const [words, setWords] = useState([]);
  const [selectedWord, setSelectedWord] = useState("");
  const [questionType, setQuestionType] = useState("MCQ");
  const [questionText, setQuestionText] = useState("");
  // const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);

  const [signal,setSignal] = useState("");
 
  const [options, setOptions] = useState([]);


  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

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

  const fetchWords = async (studyPlanId) => {
    if (!studyPlanId) return;
    try {
      const res = await axios.get(`${server_base_url}/get-words/study-plan/${studyPlanId}`);
      setWords(res.data.words);
    } catch (error) {
      console.error("Error fetching words:", error);
    }
  };

  const handleQuestionSubmit = async (flag) => {
    let endpoint = "add-question";
    if(flag == "AddUpdate") endpoint = "add-question-and-update-test";
    setSignal(endpoint);
    if (!selectedStudyPlan || !selectedWord || !questionText || !correctAnswer) {
      alert("Please fill all required fields!");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${server_base_url}/admin/${endpoint}`, {
        word_id: selectedWord,
        question_type: questionType,
        question: questionText,
        options: questionType === "MCQ" ? options : [],
        answer: correctAnswer,
        explanation,
        difficulty,
      });

      alert("Question added successfully!");
      setSelectedWord("");
      setWords([]);
      setQuestionText("");
      setOptions([]);
      setCorrectAnswer("");
      setExplanation("");
      setDifficulty("medium");
    } catch (error) {
      console.error("Error adding question:", error);
    }
    setLoading(false);
  };

  return (
    <div className="admin-panel">
      <h2>Add New Question</h2>
      <form className="admin-form">
        <div className="form-group">
          <label>Study Plan:</label>
          <select
            className="form-input"
            onChange={(e) => {
              setSelectedStudyPlan(e.target.value);
              fetchWords(e.target.value);
            }}
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
          <label>Word:</label>
          <select
            className="form-input"
            onChange={(e) => setSelectedWord(e.target.value)}
            value={selectedWord}
            disabled={!selectedStudyPlan}
          >
            <option value="">Select Word</option>
            {words.map((word) => (
              <option key={word._id} value={word._id}>
                {word.word}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Question Type:</label>
          <select
            className="form-input"
            onChange={(e) => setQuestionType(e.target.value)}
            value={questionType}
          >
            <option value="MCQ">Multiple Choice (MCQ)</option>
            <option value="FILL_IN_THE_BLANK">Fill in the Blank</option>
          </select>
        </div>

        <div className="form-group">
          <label>Question:</label>
          <textarea
            className="form-input"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            required
          />
        </div>

        {questionType === "MCQ" && (
          <div className="form-group">
            <label>Options:</label>
            <div className="options-container">
              {options.map((option, index) => (
                <div key={index} className="option-item">
                  <input
                    type="text"
                    className="form-input option-input"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="delete-option-btn"
                    onClick={() => removeOption(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-option-btn"
                onClick={addOption}
              >
                + Add Option
              </button>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Correct Answer:</label>
          <input
            type="text"
            className="form-input"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Explanation (Optional):</label>
          <textarea
            className="form-input"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Difficulty:</label>
          <select
            className="form-input"
            onChange={(e) => setDifficulty(e.target.value)}
            value={difficulty}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <button onClick={()=>handleQuestionSubmit("Add")} type="button" className="submit-btn" disabled={loading}>
          {(loading && signal == "Add") ? "Adding..." : "Add Question"}
        </button>
        <button onClick={()=>handleQuestionSubmit("AddUpdate")} type="button" className="submit-btn" disabled={loading}>
          {(loading && signal == "AddUpdate") ? "Adding..." : "Add Question & Update Test"}
        </button>
      </form>
    </div>
  );
};

export default AddQuestionForm;
