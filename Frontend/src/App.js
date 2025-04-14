import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import CoverPage from './pages/CoverPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

import LearningPlayground from "./pages/LearningPlayGround";
import WordForest from './pages/WordForest';
import TestPage from './pages/TestPage';


import AdminDashboard from './pages/AdminDashboard';
import AddBadgeForm from './pages/AddBadgeForm';
import AddStudyPlanForm from './pages/AddStudyPlanForm';
import AddWordForm from './pages/AddWordForm'; 
import AddQuestionForm from './pages/AddQuestionForm';
import AddTestForm from './pages/AddTestForm';


import LearningJourney from './components/LearningJourney';

import BadgesDisplay from './components/BadgesDisplay';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CoverPage />} />
        <Route path="/login/user" element={<Login />} />
        <Route path="/signup/user" element={<Signup />} />
        <Route path="/home" element={<Home />} />

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/add-word" element={<AddWordForm />} />
        <Route path="/admin/add-studyplan" element={<AddStudyPlanForm />} />
        <Route path="/admin/add-question" element={<AddQuestionForm />} />
        <Route path="/admin/add-test" element={<AddTestForm />} />
        <Route path="/admin/add-badge" element={<AddBadgeForm />} />
        

        <Route path="/study-plan/:studyPlanId" element={<LearningPlayground />} />
        <Route path="/study-plan/:studyPlanId/day/:selectedDay" element={<WordForest />} />

        <Route path="/daily-test/:studyPlanId/day/:selectedDay" element={<TestPage />} />

        <Route path="/learning-journey" element={<LearningJourney />} />

        <Route path="/user/badges" element={<BadgesDisplay />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
