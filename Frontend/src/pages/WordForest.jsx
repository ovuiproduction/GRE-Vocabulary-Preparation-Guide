import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/WordForest.css";

const server_base_url = process.env.SERVER_URL;


const WordForest = () => {
  const { studyPlanId, selectedDay } = useParams();
  const [words, setWords] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (studyPlanId && selectedDay && userData) {
      fetchWords();
    }
  }, [studyPlanId, selectedDay, userData]);

  const fetchWords = async () => {
    try {
      const [wordsRes, progressRes] = await Promise.all([
        axios.get(
          `${server_base_url}/get-words/${studyPlanId}/day/${selectedDay}`
        ),
        axios.get(
          `${server_base_url}/get-learning-progress/${userData._id}/${studyPlanId}`
        ),
      ]);

      const learnedWords = new Set(
        progressRes.data.map((entry) => entry.word_id)
      );

      const updatedWords = wordsRes.data.words.map((word) => ({
        ...word,
        status: learnedWords.has(word._id) ? "learned" : "not-learned",
      }));

      setWords(updatedWords);
      setSelectedWord(updatedWords[0] || null);
    } catch (error) {
      console.error("Error fetching words and progress:", error);
    }
  };

  const markWordAsLearned = async () => {
    if (!selectedWord || !userData) return;

    try {
      await axios.put(
        `${server_base_url}/update-learning-progress/${userData._id}/${studyPlanId}/day/${selectedDay}/${selectedWord._id}`,
        {
          status: "learned",
          learned_on: new Date(),
        }
      );

      // Update UI
      const updatedWords = words.map((word) =>
        word._id === selectedWord._id ? { ...word, status: "learned" } : word
      );
      setWords(updatedWords);

      // Select the next word
      const nextIndex =
        words.findIndex((word) => word._id === selectedWord._id) + 1;
      if (nextIndex < words.length) {
        setSelectedWord(words[nextIndex]);
      }
    } catch (error) {
      console.error("Error updating learning progress:", error);
    }
  };
  const renderContentSection = (title, content) => {
    if (!content || content.length === 0) return null;

    return (
      <div className="wordforest-modal-section">
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

  return (
    <div className="wordforest-container">
      <header className="wordforest-header">
        <div className="wordforest-header-content">
          <h1 className="wordforest-header-title">
            Day {selectedDay || "Selected Day"}
          </h1>
          <div className="wordforest-header-stats"></div>
        </div>
        <span className="learning-playground-word-count">
          {words.length} words to learn
        </span>
      </header>

      <div className="wordforest-main-content">
        <nav className={"wordforest-sidebar"}>
          <div className="wordforest-sidebar-inner">
            <h3 className="wordforest-sidebar-title">Course Content</h3>
            <div className="wordforest-days-list">
              {words.map((word, index) => (
                <button
                  key={index}
                  className={`wordforest-day-item ${
                    word === selectedWord ? "active" : ""
                  } ${word.status === "learned" ? "word-learned" : ""}`}
                  onClick={() => setSelectedWord(word)}
                >
                  <span className="wordforest-day-number">{word.word}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <main className="wordforest-content">
          <div className="wordforest-content-header">
            <h2 className="wordforest-modal-title">
              {selectedWord && selectedWord.word}
              {selectedWord && (
                <>
                  <span className="wordforest-word-tier">
                    Tier {selectedWord.tier}
                  </span>
                </>
              )}
            </h2>
          </div>

          <div className="wordforest-word-content">
            {selectedWord && (
              <div className="wordforest-word-modal">
                <div className="wordforest-modal-content">
                  <div className="wordforest-modal-body">
                    {renderContentSection(
                      "Definition",
                      selectedWord.definition
                    )}
                    {renderContentSection("Synonyms", selectedWord.synonyms)}
                    {renderContentSection("Antonyms", selectedWord.antonyms)}

                    {selectedWord.content?.stories?.length > 0 && (
                      <div className="wordforest-modal-section">
                        <h4>Stories</h4>
                        {selectedWord.content.stories.map((story, index) => (
                          <div key={index} className="wordforest-story">
                            <p>{story.text}</p>
                            <div className="wordforest-story-meta">
                              <span>Upvotes: {story.upvotes}</span>
                              <span>By User {story.created_by}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedWord.content?.mnemonics?.length > 0 && (
                      <div className="wordforest-modal-section">
                        <h4>Mnemonics</h4>
                        {selectedWord.content.mnemonics.map(
                          (mnemonic, index) => (
                            <div key={index} className="wordforest-mnemonic">
                              <p>{mnemonic.text}</p>
                              {mnemonic.media_url && (
                                <img
                                  src={mnemonic.media_url}
                                  alt="Mnemonic visual aid"
                                  className="wordforest-mnemonic-media"
                                />
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className="wordforest-modal-actions">
                      <button
                        className="wordforest-complete-button"
                        onClick={markWordAsLearned}
                        disabled={selectedWord?.status === "learned"}
                      >
                        {selectedWord?.status === "learned"
                          ? "Completed"
                          : "Mark as Completed"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default WordForest;
