import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const ProgressLineChart = ({ progressData }) => {
  const labels = progressData.map((item, index) => `Day ${index + 1}`);
  const wordsLearned = progressData.map((item) => item.wordsLearned); // Assuming learnedWords field exists

  const data = {
    labels,
    datasets: [
      {
        label: 'Words Learned  ',
        data: wordsLearned,
        borderColor: '#4F46E5', // Indigo-600
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        pointBackgroundColor: '#4F46E5',
        pointRadius: 5,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#333',
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#555',
        },
        grid: {
          display: false,
        },
      },
      y: {
        min: 0,
        max: 20,
        ticks: {
          stepSize: 5,
          color: '#555',
        },
        grid: {
          color: '#eee',
        },
        title: {
          display: true,
          text: 'Words Learned',
          color: '#444',
          font: {
            size: 14,
          },
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default ProgressLineChart;
