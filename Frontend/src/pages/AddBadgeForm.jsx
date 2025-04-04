import React, { useState } from "react";
import axios from "axios";
import "../css/AddBadgeForm.css";

const AddBadgeForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "test_score",
    threshold: 1,
  });
  const [iconFile, setIconFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("icon", iconFile);
    fd.append("name", formData.name);
    fd.append("description", formData.description);
    fd.append(
      "criteria",
      JSON.stringify({
        type: formData.type,
        threshold: formData.threshold,
      })
    );

    try {
      await axios.post("http://localhost:5000/admin/add-badge", fd);
      setShowToast(true);

      // Reset form after success
      setFormData({
        name: "",
        description: "",
        type: "test_score",
        threshold: 1,
      });
      setIconFile(null);
      setPreviewURL("");

      // Hide toast after 3 seconds
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error("Badge upload failed:", err);
      alert("Failed to create badge.");
    }
  };

  return (
    <>
      <div className="add-badge-form-container">
        <h2 className="add-badge-form-title">Create New Badge</h2>
        <form className="add-badge-form" onSubmit={handleSubmit}>
          {/* Form Fields as before */}
          {/* ... unchanged fields ... */}
          <div className="add-badge-form-group">
            <label className="add-badge-form-label">Name</label>
            <input
              type="text"
              className="add-badge-form-input"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="add-badge-form-group">
            <label className="add-badge-form-label">Description</label>
            <input
              type="text"
              className="add-badge-form-input"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          <div className="add-badge-form-group">
            <label className="add-badge-form-label">Badge Type</label>
            <select
              className="add-badge-form-select"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
            >
              <option value="test_score">Test Score</option>
              <option value="test_high_scores">High Scores</option>
              <option value="test_streak_score">Test Streak</option>
              <option value="test_improvement">Improvement</option>
              <option value="streak">Login Streak</option>
            </select>
          </div>

          <div className="add-badge-form-group">
            <label className="add-badge-form-label">Threshold</label>
            <input
              type="number"
              className="add-badge-form-input"
              value={formData.threshold}
              onChange={(e) =>
                setFormData({ ...formData, threshold: Number(e.target.value) })
              }
              required
            />
          </div>

          <div className="add-badge-form-group">
            <label className="add-badge-form-label">Badge Icon</label>
            <input
              type="file"
              accept="image/*"
              className="add-badge-form-file"
              onChange={(e) => {
                setIconFile(e.target.files[0]);
                setPreviewURL(URL.createObjectURL(e.target.files[0]));
              }}
              required
            />
            {previewURL && (
              <img
                src={previewURL}
                alt="Preview"
                className="add-badge-form-preview"
              />
            )}
          </div>

          <button type="submit" className="add-badge-form-submit-btn">
            Create Badge
          </button>
        </form>
      </div>

      {showToast && (
        <div className="add-badge-toast">
          <span>Badge Created Successfully! ✅</span>
          <div className="add-badge-toast-bar" />
        </div>
      )}
    </>
  );
};

export default AddBadgeForm;
