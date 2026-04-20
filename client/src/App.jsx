import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ResumeUpload from './pages/ResumeUpload';
import InterviewSetup from './pages/InterviewSetup';
import InterviewSession from './pages/InterviewSession';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<ResumeUpload />} />
        <Route path="/setup" element={<InterviewSetup />} />
        <Route path="/session" element={<InterviewSession />} />
      </Routes>
    </Router>
  );
}

export default App;
