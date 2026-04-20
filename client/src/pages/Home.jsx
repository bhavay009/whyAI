import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BrainCircuit } from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-bg-glow"></div>
      <div className="hero-content animate-slide-up">
        <div className="hero-badge">
          <BrainCircuit size={16} />
          Next-Gen AI Interview Simulator
        </div>
        <h1 className="hero-title">Master Your Tech Interviews</h1>
        <p className="hero-subtitle">
          WhyHire AI dynamically adapts to your experience. Practice explaining your projects, face deep technical follow-ups, and refine your architectural thinking before the real thing.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="primary-btn" onClick={() => navigate('/upload')}>
            Upload Resume <ArrowRight size={20} />
          </button>
          <button className="primary-btn" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }} onClick={() => navigate('/setup')}>
            Manual Setup
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
