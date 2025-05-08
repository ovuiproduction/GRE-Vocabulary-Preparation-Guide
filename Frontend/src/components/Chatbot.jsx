import React, { useState, useRef, useEffect } from "react";
import "../css/chatbot.css";

const Chatbot = () => {
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const chatHistoryRef = useRef(null);

  const toggleChat = () => setChatVisible(!chatVisible);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMessage = { sender: "user", text: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");

    try {
      const res = await fetch("http://localhost:4000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput }),
      });

      const data = await res.json();
      const botMessage = { sender: "bot", text: data.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMsg = { sender: "bot", text: "Something went wrong." };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  useEffect(() => {
    if (chatVisible && chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages, chatVisible]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("#chatbot-container")) {
        setChatVisible(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div id="chatbot-container">
      <div id="chat-icon" onClick={toggleChat}>
        🤖
      </div>

      {chatVisible && (
        <div className="chat-box" id="chat-box">
          <div className="chat-header">GRE Mentor</div>

          <div className="chat-history" ref={chatHistoryRef}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={msg.sender === "user" ? "user-message" : "bot-message"}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <form id="chat-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask your query..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
