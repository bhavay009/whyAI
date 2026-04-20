import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './InterviewSetup.css';

const InterviewSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { prefilledProject } = location.state || {};

  const [formData, setFormData] = useState({
    role: '',
    experienceLevel: 'Mid',
    project: prefilledProject ? `${prefilledProject.name}: ${prefilledProject.description}` : ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/interview/generate-questions', formData);
      const { questions, sessionId } = response.data;
      
      navigate('/session', { 
        state: { 
          config: formData, 
          questions: questions,
          initialMessage: questions[0],
          sessionId: sessionId
        } 
      });
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to connect to the backend simulator. Is the server running on port 3001 and is GEMINI_API_KEY configured?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card glass-panel animate-slide-up">
        <h2>Configure Interview</h2>
        <p>Tell us about the role and project you want to discuss.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Target Role</label>
            <input 
              type="text" 
              name="role" 
              className="form-control" 
              placeholder="e.g. Frontend Engineer" 
              value={formData.role} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Experience Level</label>
            <select 
              name="experienceLevel" 
              className="form-control" 
              value={formData.experienceLevel} 
              onChange={handleChange}
            >
              <option value="Junior">Junior</option>
              <option value="Mid">Mid-Level</option>
              <option value="Senior">Senior</option>
            </select>
          </div>
          <div className="form-group">
            <label>Project Details</label>
            <textarea 
              name="project" 
              className="form-control" 
              placeholder="Describe a project you built (e.g. A real-time chat app using React and Socket.io)" 
              value={formData.project} 
              onChange={handleChange} 
              required 
            />
          </div>
          <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Initializing Interface...' : 'Start Session'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InterviewSetup;
