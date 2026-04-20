import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, ArrowLeft, Bot, User, CheckCircle2 } from 'lucide-react';
import './InterviewSession.css';

const InterviewSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { config, questions, initialMessage, sessionId: initialSessionId } = location.state || {};

  const [sessionId, setSessionId] = useState(initialSessionId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!config || !initialMessage) {
      navigate('/setup');
      return;
    }
    setMessages([{ role: 'ai', content: initialMessage }]);
  }, [config, initialMessage, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || isFinished) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/interview/chat', {
        history: newMessages,
        answer: input,
        sessionId: sessionId
      });
      
      const aiResponse = { role: 'ai', content: response.data.message };
      setMessages([...newMessages, aiResponse]);
      setCurrentQuestionIndex(response.data.currentQuestionIndex);
      
      if (response.data.isFinished) {
        setIsFinished(true);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages([...newMessages, { role: 'ai', content: "I'm sorry, I'm having trouble processing that. Could you try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!config) return null;

  const totalQuestions = questions?.length || 5;
  const progressPercentage = ((currentQuestionIndex) / totalQuestions) * 100;

  return (
    <div className="session-container">
      <div className="session-header glass-panel">
        <div className="header-info">
          <h2>Project Interview</h2>
          <p>{config.role} • {config.experienceLevel}</p>
        </div>
        <div className="progress-container">
          <div className="progress-text">Topic {currentQuestionIndex + 1} of {totalQuestions}</div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
        <button className="exit-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Exit
        </button>
      </div>

      <div className="chat-window" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble-container ${msg.role} animate-slide-up`}>
            <div className="avatar">
              {msg.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className={`chat-bubble ${msg.role}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble-container ai animate-slide-up">
            <div className="avatar"><Bot size={20} /></div>
            <div className="chat-bubble ai">
              <div className="loading-dots"><span></span><span></span><span></span></div>
            </div>
          </div>
        )}
        {isFinished && (
          <div className="completion-card glass-panel animate-slide-up">
            <CheckCircle2 size={48} color="#10b981" />
            <h3>Interview Completed</h3>
            <p>You've successfully answered all technical questions regarding your project.</p>
            <button className="primary-btn" onClick={() => navigate('/')}>Return Home</button>
          </div>
        )}
      </div>

      {!isFinished && (
        <div className="chat-input-area glass-panel">
          <textarea
            className="chat-input"
            placeholder="Type your technical answer... (Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
            <Send size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default InterviewSession;
