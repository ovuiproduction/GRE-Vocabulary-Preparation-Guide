import React from "react";
import "../css/OverlayView.css";

const OverlayView = ({ title, data, onClose, fields }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="overlay">
        <div className="overlay-content">
          <div className="overlay-header">
            <h2>{title}</h2>
            <button className="close-btn" onClick={onClose}>✖</button>
          </div>
          <div className="overlay-body">
            <p>No data available.</p>
          </div>
        </div>
      </div>
    );
  }

  // Auto-detect fields from first item if not passed
  const keysToShow = fields || Object.keys(data[0]).filter(
    (key) => !["_id", "__v", "createdAt", "updatedAt"].includes(key)
  );

  return (
    <div className="overlay">
      <div className="overlay-content">
        <div className="overlay-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>
        <div className="overlay-body">
          <table className="overlay-table">
            <thead>
              <tr>
                {keysToShow.map((key) => (
                  <th key={key}>{key.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  {keysToShow.map((key) => (
                    <td key={key}>{String(item[key] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverlayView;
