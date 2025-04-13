import React, { useState } from "react";
import axios from "axios";
import { useEffect } from "react";

import "../css/addwordform.css";

const server_base_url = process.env.SERVER_URL;


const AddWordForm = () => {
  const [newSynonym, setNewSynonym] = useState("");
  const [newAntonym, setNewAntonym] = useState("");
  const [studyPlans, setStudyPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    word: "",
    definition: "",
    synonyms: [],
    antonyms: [],
    tier: 1,
    difficulty: 3,
    study_plan: [],
    dayIndex:{},
    content: {
      stories: [],
      mnemonics: [],
      cartoons: [],
      clips: [],
    },
  });

  useEffect(() => {
    const fetchStudyPlans = async () => {
      try {
        const res = await axios.get(`${server_base_url}/get-study-plans`);
        if (res.data.success) {
          setStudyPlans(res.data.data);
        } else {
          console.error("Error fetching study plans.");
        }
      } catch (error) {
        console.error("Error fetching study plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchStudyPlans();
  }, []);

  const handleInputChange = (path, value) => {
    setFormData((prev) => {
      const keys = path.split(".");
      const updated = { ...prev };
      let current = updated;

      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          // Ensure arrays remain arrays
          if (Array.isArray(current[key]) && !Array.isArray(value)) {
            current[key] = [...current[key], value];
          } else {
            current[key] = value;
          }
        } else {
          if (typeof current[key] !== "object" || current[key] === null) {
            current[key] = {};
          }
          current = current[key];
        }
      });
      return updated;
    });
  };

  const handleFileUpload = async (file, index) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${server_base_url}/upload-media`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Update the media_url with the returned URL
      handleInputChange(
        `content.mnemonics.${index}.media_url`,
        response.data.fileUrl
      );
    } catch (error) {
      console.error("File upload failed:", error);
      alert("Failed to upload file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields first
      if (!formData.word.trim() || !formData.definition.trim()) {
        throw new Error("Word and definition are required");
      }

      // Ensure content arrays exist before sending
      const payload = {
        ...formData,
        content: {
          stories: Array.isArray(formData.content?.stories)
            ? formData.content.stories
            : [],
          mnemonics: Array.isArray(formData.content?.mnemonics)
            ? formData.content.mnemonics
            : [],
          cartoons: Array.isArray(formData.content?.cartoons)
            ? formData.content.cartoons
            : [],
          clips: Array.isArray(formData.content?.clips)
            ? formData.content.clips
            : [],
        },
      };

      await axios.post(`${server_base_url}/admin/add-word`, payload);

      // Reset form PROPERLY
      setFormData({
        word: "",
        definition: "",
        synonyms: [],
        antonyms: [],
        study_plan: [],
        dayIndex :{},
        tier: 1,
        difficulty: 3,
        content: {
          stories: [],
          mnemonics: [],
          cartoons: [],
          clips: [],
        },
      });

      alert("Word added successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to add word"
      );
    }
  };

  return (
    <div className="addwordform-word-form-container">
      <h2>Add New Word</h2>

      <form>
        <div className="addwordform-form-group">
          <label>Word:</label>
          <input
            type="text"
            value={formData.word}
            onChange={(e) => handleInputChange("word", e.target.value)}
            required
          />
        </div>

        <div className="addwordform-form-group">
          <label>Study Plans:</label>
          {loadingPlans ? (
            <p>Loading study plans...</p>
          ) : (
            <div className="study-plan-buttons">
              {studyPlans.map((plan) => {
                const isSelected = formData.study_plan.includes(plan._id);

                return (
                  <button
                    type="button"
                    key={plan._id}
                    className={`plan-button ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      const updatedPlans = isSelected
                        ? formData.study_plan.filter((id) => id !== plan._id)
                        : [...formData.study_plan, plan._id];

                      handleInputChange("study_plan", updatedPlans);
                    }}
                  >
                    {isSelected && <span className="tick">✅</span>}
                    {plan.name || `Plan ${plan._id}`}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="addwordform-form-group">
        {formData.study_plan.map((planId) => {
          const plan = studyPlans.find((p) => p._id === planId);
          return (
            <div key={planId} className="day-index-input">
              <label>
                {plan?.name || `Plan ${planId}`} - Day:
                <input
                  type="number"
                  min="1"
                  value={formData.dayIndex[planId] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dayIndex: {
                        ...prev.dayIndex,
                        [planId]: parseInt(e.target.value) || "",
                      },
                    }))
                  }
                />
              </label>
            </div>
          );
        })}
      </div>
        <div className="addwordform-form-group">
          <label>Definition:</label>
          <textarea
            value={formData.definition}
            onChange={(e) => handleInputChange("definition", e.target.value)}
            required
          />
        </div>

        <div className="addwordform-form-row">
          <div className="addwordform-form-group">
            <label>Synonyms:</label>
            <div className="addwordform-tag-input">
              <input
                type="text"
                value={newSynonym}
                onChange={(e) => setNewSynonym(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && newSynonym) {
                    handleInputChange("synonyms", [
                      ...formData.synonyms,
                      newSynonym,
                    ]);
                    setNewSynonym("");
                  }
                }}
                placeholder="Add synonym and press Enter"
              />
              <div className="addwordform-tags">
                {formData.synonyms.map((syn, index) => (
                  <span key={index} className="addwordform-tag">
                    {syn}
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange(
                          "synonyms",
                          formData.synonyms.filter((_, i) => i !== index)
                        )
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="addwordform-form-group">
            <label>Antonyms : </label>
            <div className="addwordform-tag-input">
              <input
                type="text"
                value={newAntonym}
                onChange={(e) => setNewAntonym(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && newAntonym) {
                    handleInputChange("antonyms", [
                      ...formData.antonyms,
                      newAntonym,
                    ]);
                    setNewAntonym("");
                  }
                }}
                placeholder="Add antonym and press Enter"
              />
              <div className="addwordform-tags">
                {formData.antonyms.map((syn, index) => (
                  <span key={index} className="addwordform-tag">
                    {syn}
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange(
                          "antonyms",
                          formData.antonyms.filter((_, i) => i !== index)
                        )
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="addwordform-content-section">
          <h3>Learning Content</h3>
          <div className="addwordform-content-group">
            <h4>Stories</h4>
            {(Array.isArray(formData.content?.stories)
              ? formData.content.stories
              : []
            ).map((story, index) => (
              <div key={index} className="content-item">
                <textarea
                  value={story.text}
                  onChange={(e) =>
                    handleInputChange(
                      `content.stories.${index}.text`,
                      e.target.value
                    )
                  }
                  placeholder="Enter story text"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleInputChange("content.stories", { text: "" })}
            >
              Add Story
            </button>
          </div>

          <div className="addwordform-content-group">
            <h4>Mnemonics</h4>
            {(Array.isArray(formData.content?.mnemonics)
              ? formData.content.mnemonics
              : []
            ).map((mnemonic, index) => (
              <div key={index} className="content-item">
                <input
                  type="text"
                  value={mnemonic.text}
                  onChange={(e) =>
                    handleInputChange(
                      `content.mnemonics.${index}.text`,
                      e.target.value
                    )
                  }
                  placeholder="Mnemonic text"
                />

                <input
                  type="file"
                  accept="image/*, video/*, .gif"
                  onChange={(e) => handleFileUpload(e.target.files[0], index)}
                />

                {mnemonic.media_url && (
                  <div className="preview">
                    {mnemonic.media_url &&
                      (mnemonic.media_url.match(/\.(jpeg|jpg|png|gif)$/) ? (
                        <img
                          src={mnemonic.media_url}
                          alt="Preview"
                          width="100"
                        />
                      ) : (
                        <video src={mnemonic.media_url} width="100" controls />
                      ))}
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                handleInputChange("content.mnemonics", {
                  text: "",
                  media_url: "",
                })
              }
            >
              Add Mnemonic
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          type="button"
          className="addwordform-submit-btn"
        >
          Add Word
        </button>
      </form>
    </div>
  );
};

export default AddWordForm;
