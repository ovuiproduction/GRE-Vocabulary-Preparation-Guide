import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CoverPage from './pages/CoverPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import NotFound from './pages/NotFound';


import StudyPlanForm from './pages/StudyPlanForm';
import AddWordForm from './pages/AddWordForm'; 

import LearningPlayground from "./pages/LearningPlayGround";

import WordForest from './pages/WordForest';

import AddQuestionForm from './pages/AddQuestionForm';

import AddTestForm from './pages/AddTestForm';

import TestPage from './pages/TestPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CoverPage />} />
        <Route path="/login/user" element={<Login />} />
        <Route path="/signup/user" element={<Signup />} />
        <Route path="/home" element={<Home />} />


        <Route path="/admin/add-word" element={<AddWordForm />} />
        <Route path="/admin/add-studyplan" element={<StudyPlanForm />} />
        <Route path="/admin/add-question" element={<AddQuestionForm />} />
        <Route path="/admin/add-test" element={<AddTestForm />} />
        

        <Route path="/study-plan/:studyPlanId" element={<LearningPlayground />} />
        <Route path="/study-plan/:studyPlanId/day/:selectedDay" element={<WordForest />} />

        <Route path="/daily-test/:studyPlanId/day/:selectedDay" element={<TestPage />} />


        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
