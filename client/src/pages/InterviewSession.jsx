import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, ArrowLeft, Bot, User, CheckCircle2, Zap } from 'lucide-react';
import './InterviewSession.css';

const API = 'http://localhost:3001/api/interview';

const FOLLOW_UP_STYLES = {
  why: { label: '🔍 Why this decision?', className: 'badge-why' },
  edge_cases: { label: '⚠️ Edge Cases', className: 'badge-edge' },
  alternatives: { label: '🔀 Alternatives', className: 'badge-alt' },
};

const InterviewSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { config, questions, initialMessage, sessionId: initialSessionId } = location.state || {};

  const [sessionId] = useState(initialSessionId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [mode, setMode] = useState('chat'); // 'chat' | 'followup'

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

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

  const addMessages = (prev, ...newMsgs) => [...prev, ...newMsgs];

  const handleSend = async () => {
    if (!input.trim() || isFinished || loading) return;

    const userAnswer = input.trim();
    setInput('');
    setLoading(true);

    const userMsg = { role: 'user', content: userAnswer };
    setMessages(prev => addMessages(prev, userMsg));

    try {
      if (mode === 'followup') {
        // Call dedicated /follow-up endpoint
        const res = await axios.post(`${API}/follow-up`, {
          history: messages,
          answer: userAnswer,
          sessionId
        });

        const { message, followUpType, followUpLabel } = res.data;
        setMessages(prev => addMessages(prev, {
          role: 'ai',
          content: message,
          followUpType,
          followUpLabel
        }));

      } else {
        // Regular chat turn — triggers adaptive follow-up OR transition
        const res = await axios.post(`${API}/chat`, {
          history: messages,
          answer: userAnswer,
          sessionId
        });

        const { message, currentQuestionIndex: qi, isFinished: done, isTransition } = res.data;

        setMessages(prev => addMessages(prev, {
          role: 'ai',
          content: message,
          isTransition
        }));

        setCurrentQuestionIndex(qi);
        if (done) setIsFinished(true);

        // After the first answer to each main question, switch to follow-up mode
        if (!isTransition && !done) {
          setMode('followup');
        }
        // After transition to a new main question, go back to chat mode
        if (isTransition) {
          setMode('chat');
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => addMessages(prev, {
        role: 'ai',
        content: "I'm having trouble right now. Please try again."
      }));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Let user manually request a follow-up on the current topic
  const requestFollowUp = async () => {
    if (loading || isFinished) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/follow-up`, {
        history: messages,
        answer: messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '',
        sessionId
      });
      const { message, followUpType, followUpLabel } = res.data;
      setMessages(prev => addMessages(prev, {
        role: 'ai',
        content: message,
        followUpType,
        followUpLabel
      }));
      setMode('followup');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!config) return null;

  const totalQuestions = questions?.length || 5;
  const progressPercentage = (currentQuestionIndex / totalQuestions) * 100;

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
            <div className="bubble-content">
              {/* Badge for follow-up type */}
              {msg.followUpType && (
                <span className={`follow-up-badge ${FOLLOW_UP_STYLES[msg.followUpType]?.className || ''}`}>
                  {FOLLOW_UP_STYLES[msg.followUpType]?.label || msg.followUpLabel}
                </span>
              )}
              {/* Badge for topic transition */}
              {msg.isTransition && (
                <span className="follow-up-badge badge-transition">
                  ➡️ Next Topic
                </span>
              )}
              <div className={`chat-bubble ${msg.role}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-bubble-container ai animate-slide-up">
            <div className="avatar"><Bot size={20} /></div>
            <div className="bubble-content">
              <div className="chat-bubble ai">
                <div className="loading-dots"><span></span><span></span><span></span></div>
              </div>
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
        <div className="chat-input-wrapper">
          {/* Contextual hint bar */}
          {mode === 'followup' && !loading && (
            <div className="hint-bar">
              <Zap size={14} />
              <span>AI will ask a follow-up. Answer or <button className="hint-skip" onClick={() => setMode('chat')}>skip to next question</button>.</span>
            </div>
          )}

          <div className="chat-input-area glass-panel">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder={mode === 'followup'
                ? 'Answer the follow-up question...'
                : 'Type your technical answer... (Enter to send)'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <div className="input-actions">
              {/* Request a specific follow-up manually */}
              <button
                className="followup-btn"
                onClick={requestFollowUp}
                disabled={loading || messages.length < 2}
                title="Ask a deeper follow-up question"
              >
                <Zap size={18} />
              </button>

              <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
                <Send size={22} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSession;
