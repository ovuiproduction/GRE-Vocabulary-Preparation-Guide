import React, { useState} from 'react';
import axios from 'axios';

import "../css/study_plan.css";

const AddStudyPlanForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    duration_days: 30,
    daily_new_words: 15,
    total_words: 450,
    revision_strategy: {
      mode: 'adaptive',
      rules: {
        min_incorrect_attempts: 2,
        max_revisions_per_day: 10,
        retention_threshold: 0.7
      }
    },
    word_list: []
  });

  // const [words, setWords] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');

  // Fetch all words for selection
  // useEffect(() => {
  //   const fetchWords = async () => {
  //     try {
  //       const response = await axios.get('http://localhost:5000/get-words');
  //       setWords(response.data);
  //       setLoading(false);
  //     } catch (err) {
  //       setError('Failed to load words');
  //       setLoading(false);
  //     }
  //   };
  //   fetchWords();
  // }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_days' || name === 'daily_new_words' || name === 'total_words' 
        ? Number(value)
        : value
    }));
  };

  const handleStrategyChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      revision_strategy: {
        ...prev.revision_strategy,
        rules: {
          ...prev.revision_strategy.rules,
          [name]: Number(value)
        }
      }
    }));
  };

  // const handleWordSelect = (wordId) => {
  //   setFormData(prev => ({
  //     ...prev,
  //     word_list: prev.word_list.includes(wordId)
  //       ? prev.word_list.filter(id => id !== wordId)
  //       : [...prev.word_list, wordId]
  //   }));
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/admin/add-study-plan', formData);
      alert('Study plan created successfully!');
      // Reset form
      setFormData({
        ...formData,
        name: '',
        word_list: []
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Creation failed');
    }
  };

  // if (loading) return <div>Loading words...</div>;
  // if (error) return <div>Error: {error}</div>;

  return (
    <div className="admin-form">
      <h2>Create New Study Plan</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-group">
          <label>Plan Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Duration (days):</label>
            <input
              type="number"
              name="duration_days"
              value={formData.duration_days}
              onChange={handleInputChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Daily New Words:</label>
            <input
              type="number"
              name="daily_new_words"
              value={formData.daily_new_words}
              onChange={handleInputChange}
              min="5"
              required
            />
          </div>

          <div className="form-group">
            <label>Total Words:</label>
            <input
              type="number"
              name="total_words"
              value={formData.total_words}
              onChange={handleInputChange}
              min="100"
              required
            />
          </div>
        </div>

        {/* Revision Strategy */}
        <div className="strategy-section">
          <h3>Revision Strategy</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Min Incorrect Attempts:</label>
              <input
                type="number"
                name="min_incorrect_attempts"
                value={formData.revision_strategy.rules.min_incorrect_attempts}
                onChange={handleStrategyChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Max Revisions/Day:</label>
              <input
                type="number"
                name="max_revisions_per_day"
                value={formData.revision_strategy.rules.max_revisions_per_day}
                onChange={handleStrategyChange}
                min="5"
                required
              />
            </div>

            <div className="form-group">
              <label>Retention Threshold:</label>
              <input
                type="number"
                step="0.1"
                name="retention_threshold"
                value={formData.revision_strategy.rules.retention_threshold}
                onChange={handleStrategyChange}
                min="0.1"
                max="1.0"
                required
              />
            </div>
          </div>
        </div>
        <button type="submit" className="submit-btn">
          Create Study Plan
        </button>
      </form>
    </div>
  );
};

export default AddStudyPlanForm;