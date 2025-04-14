import { useEffect, useState } from "react";
import axios from "axios";

const server_base_url = process.env.REACT_APP_SERVER_URL;

const DailyTestCard = ({ userData,selectedDay,studyPlanId }) => {
  const [testStatus, setTestStatus] = useState("loading"); // loading, not-attempted, attempted
  const [scoreData, setScoreData] = useState(null);

  useEffect(() => {
    const fetchDailyTestStatus = async () => {
      try {
     
        const resTest = await axios.get(
          `${server_base_url}/get-test/${studyPlanId}/day/${selectedDay}`
        );

        const testId = resTest.data?.test?.[0]?._id;

        if (!testId) {
          setTestStatus("not-available");
          return;
        }

        const resTrack = await axios.get(
          `${server_base_url}/test-track-status?userId=${userData._id}&studyPlanId=${studyPlanId}&testId=${testId}`
        );

        if (resTrack.data?.attempted) {
          setTestStatus("attempted");
          setScoreData(resTrack.data);
        } else {
          setTestStatus("not-attempted");
        }
      } catch (error) {
        console.error("Error fetching test status:", error);
        setTestStatus("error");
      }
    };

    if (userData) {
      fetchDailyTestStatus();
    }
  }, [userData,selectedDay,studyPlanId]);

 const handleDailyTest = () => {
    if (studyPlanId && selectedDay) {
      window.open(`#/daily-test/${studyPlanId}/day/${selectedDay}`);
    }
  };

  return (
    <div className="learning-playground-word-card">
      <div className="learning-playground-word-content">
        <h3 className="learning-playground-word-title">Daily Test</h3>

        {testStatus === "loading" && <p>Checking test status...</p>}
        {testStatus === "not-attempted" && (
          <p style={{ color: "#666", fontSize: "14px" }}>
            You haven't attempted today's test.
          </p>
        )}
        {testStatus === "attempted" && scoreData && (
          <p style={{ color: "#007bff", fontWeight: "bold", fontSize: "15px" }}>
            Score: {scoreData.correct_answers}/{scoreData.total_questions} (
            {scoreData.score}%)
          </p>
        )}
        {testStatus === "not-available" && (
          <p style={{ color: "red", fontSize: "14px" }}>No test available today.</p>
        )}
        <button
          className="learning-playground-learn-button"
          onClick={handleDailyTest}
        >
          {testStatus === "attempted" ? "Retake Test" : "Start Test"}
        </button>
      </div>
    </div>
  );
};

export default DailyTestCard;
