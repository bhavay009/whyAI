import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import './ResumeUpload.css';

const ResumeUpload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setLoading(true);
    setExtractedData(null);
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await axios.post('http://localhost:3001/api/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setExtractedData(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to extract data. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  const proceedToSimulator = (project) => {
    navigate('/setup', { state: { prefilledProject: project } });
  };

  return (
    <div className="upload-container animate-slide-up">
      <div className="upload-header">
        <h1>Upload Your Resume</h1>
        <p>Let our AI instantly extract your projects and skills for the interview simulator.</p>
      </div>

      {!extractedData && (
        <div 
          className="dropzone" 
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf" 
            style={{ display: 'none' }} 
          />
          <UploadCloud size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h3>{file ? file.name : "Click or Drag to Upload PDF"}</h3>
          <p>Maximum file size: 5MB</p>
          
          {file && (
            <button 
              className="primary-btn" 
              onClick={(e) => { e.stopPropagation(); handleUpload(); }}
              style={{ marginTop: '2rem' }}
              disabled={loading}
            >
              {loading ? "Analyzing Document..." : "Extract Data"}
            </button>
          )}
          {error && <p style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</p>}
        </div>
      )}

      {extractedData && (
        <div className="extracted-data-container animate-slide-up">
          <div className="glass-panel data-section">
            <h3><CheckCircle size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} /> Analysis Complete</h3>
            <p style={{ color: 'var(--text-muted)' }}>We successfully parsed your resume. Here is what we found:</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="glass-panel data-section">
              <h3>Core Skills</h3>
              <div className="pills-container">
                {extractedData.skills?.map((skill, i) => (
                  <span key={i} className="pill">{skill}</span>
                ))}
              </div>
            </div>

            <div className="glass-panel data-section">
              <h3>Technologies</h3>
              <div className="pills-container">
                {extractedData.technologies?.map((tech, i) => (
                  <span key={i} className="pill">{tech}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel data-section">
            <h3>Extracted Projects</h3>
            {extractedData.projects?.map((project, i) => (
              <div key={i} className="project-card">
                <h4><FileText size={18} style={{ display: 'inline', marginRight: '8px' }} /> {project.name}</h4>
                <p>{project.description}</p>
                <div className="pills-container">
                  {project.technologies?.map((tech, j) => (
                    <span key={j} className="pill" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>{tech}</span>
                  ))}
                </div>
                <button 
                  className="primary-btn" 
                  style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  onClick={() => proceedToSimulator(project)}
                >
                  Interview For This Project <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="action-row">
            <button className="primary-btn" style={{ background: 'transparent', border: '1px solid var(--accent-primary)' }} onClick={() => navigate('/setup')}>
              Skip to Manual Setup Instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
