import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Send, ArrowLeft, Bot, User, CheckCircle2, Zap,
  ChevronDown, ChevronUp, TrendingUp, AlertCircle, Sparkles, Star
} from 'lucide-react';
import './InterviewSession.css';

const API = 'http://localhost:3001/api/interview';

const FOLLOW_UP_STYLES = {
  why:        { label: '🔍 Why this decision?', className: 'badge-why' },
  edge_cases: { label: '⚠️ Edge Cases',         className: 'badge-edge' },
  alternatives:{ label: '🔀 Alternatives',      className: 'badge-alt' },
};

// ─── Score Ring ───────────────────────────────────────────────────────────────
const ScoreRing = ({ score, label }) => {
  const r = 22, c = 2 * Math.PI * r;
  const filled = (score / 10) * c;
  const color = score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#ef4444';
  return (
    <div className="score-ring-wrap">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${filled} ${c}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x="28" y="33" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">{score}</text>
      </svg>
      <span className="score-ring-label">{label}</span>
    </div>
  );
};

// ─── Evaluation Card ─────────────────────────────────────────────────────────
const EvaluationCard = ({ evaluation, isLoading, question, answer, sessionId }) => {
  const [expanded, setExpanded] = useState(false);
  const [improved, setImproved] = useState(null);
  const [loadingImprove, setLoadingImprove] = useState(false);

  const handleImprove = async () => {
    setLoadingImprove(true);
    try {
      const res = await axios.post(`${API}/improve-answer`, { question, answer, sessionId });
      setImproved(res.data.improvedAnswer);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingImprove(false);
    }
  };

  if (isLoading) {
    return (
      <div className="eval-card eval-loading">
        <div className="loading-dots"><span/><span/><span/></div>
        <span>Evaluating your answer…</span>
      </div>
    );
  }

  if (!evaluation) return null;

  const { scores, strengths, weaknesses, summary } = evaluation;
  const overallColor = scores.overall >= 8 ? 'good' : scores.overall >= 6 ? 'mid' : 'low';

  return (
    <div className={`eval-card eval-${overallColor}`}>
      {/* Header — always visible */}
      <div className="eval-header" onClick={() => setExpanded(e => !e)}>
        <div className="eval-overall">
          <Star size={14} />
          <span>Score: <strong>{scores.overall}/10</strong></span>
        </div>
        <span className="eval-summary-short">{summary}</span>
        <button className="eval-toggle">
          {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="eval-body">
          {/* Score rings */}
          <div className="score-rings">
            <ScoreRing score={scores.depth}     label="Depth"     />
            <ScoreRing score={scores.clarity}   label="Clarity"   />
            <ScoreRing score={scores.reasoning} label="Reasoning" />
          </div>

          {/* Strengths & Weaknesses */}
          <div className="eval-feedback-grid">
            <div className="eval-feedback-col strengths">
              <div className="eval-feedback-title"><TrendingUp size={13}/> Strengths</div>
              {strengths.map((s, i) => <div key={i} className="eval-item">✓ {s}</div>)}
            </div>
            <div className="eval-feedback-col weaknesses">
              <div className="eval-feedback-title"><AlertCircle size={13}/> To Improve</div>
              {weaknesses.map((w, i) => <div key={i} className="eval-item">✗ {w}</div>)}
            </div>
          </div>

          {/* Improve answer */}
          {!improved && (
            <button className="improve-btn" onClick={handleImprove} disabled={loadingImprove}>
              <Sparkles size={14}/>
              {loadingImprove ? 'Rewriting…' : 'Show Improved Answer'}
            </button>
          )}

          {improved && (
            <div className="improved-answer">
              <div className="improved-label"><Sparkles size={13}/> AI-Improved Version</div>
              <p>{improved}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const InterviewSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { config, questions, initialMessage, sessionId } = location.state || {};

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [mode, setMode] = useState('chat');

  // evaluations[msgIdx] = { evaluation, isLoading, question, answer }
  const [evaluations, setEvaluations] = useState({});

  const scrollRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (!config || !initialMessage) { navigate('/setup'); return; }
    setMessages([{ role: 'ai', content: initialMessage }]);
  }, [config, initialMessage, navigate]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, evaluations]);

  // Fire evaluation for a user message in the background
  const triggerEvaluation = useCallback(async (userMsgIdx, question, answer) => {
    setEvaluations(prev => ({ ...prev, [userMsgIdx]: { isLoading: true, question, answer } }));
    try {
      const res = await axios.post(`${API}/evaluate-answer`, { question, answer, sessionId });
      setEvaluations(prev => ({
        ...prev,
        [userMsgIdx]: { isLoading: false, evaluation: res.data, question, answer }
      }));
    } catch (e) {
      console.error('Evaluation failed:', e);
      setEvaluations(prev => ({ ...prev, [userMsgIdx]: null }));
    }
  }, [sessionId]);

  const handleSend = async () => {
    if (!input.trim() || isFinished || loading) return;
    const userAnswer = input.trim();
    setInput('');
    setLoading(true);

    // Find the last AI question for evaluation context
    const lastAIMsg = [...messages].reverse().find(m => m.role === 'ai');
    const currentQuestion = lastAIMsg?.content || '';

    const userMsgIdx = messages.length; // index this message will get
    const userMsg = { role: 'user', content: userAnswer };
    setMessages(prev => [...prev, userMsg]);

    try {
      if (mode === 'followup') {
        const res = await axios.post(`${API}/follow-up`, {
          history: messages, answer: userAnswer, sessionId
        });
        const { message, followUpType, followUpLabel } = res.data;
        setMessages(prev => [...prev, { role: 'ai', content: message, followUpType, followUpLabel }]);
      } else {
        const res = await axios.post(`${API}/chat`, {
          history: messages, answer: userAnswer, sessionId
        });
        const { message, currentQuestionIndex: qi, isFinished: done, isTransition } = res.data;
        setMessages(prev => [...prev, { role: 'ai', content: message, isTransition }]);
        setCurrentQuestionIndex(qi);
        if (done) setIsFinished(true);
        if (!isTransition && !done) setMode('followup');
        if (isTransition) setMode('chat');
      }

      // Evaluate the user's answer in the background
      triggerEvaluation(userMsgIdx, currentQuestion, userAnswer);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: "I'm having trouble right now. Please try again." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const requestFollowUp = async () => {
    if (loading || isFinished) return;
    setLoading(true);
    try {
      const lastUser = [...messages].reverse().find(m => m.role === 'user');
      const res = await axios.post(`${API}/follow-up`, {
        history: messages, answer: lastUser?.content || '', sessionId
      });
      const { message, followUpType, followUpLabel } = res.data;
      setMessages(prev => [...prev, { role: 'ai', content: message, followUpType, followUpLabel }]);
      setMode('followup');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (!config) return null;

  const totalQuestions = questions?.length || 5;
  const progressPercent = (currentQuestionIndex / totalQuestions) * 100;

  return (
    <div className="session-container">
      {/* ── Header ── */}
      <div className="session-header glass-panel">
        <div className="header-info">
          <h2>Project Interview</h2>
          <p>{config.role} • {config.experienceLevel}</p>
        </div>
        <div className="progress-container">
          <div className="progress-text">Topic {currentQuestionIndex + 1} of {totalQuestions}</div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}/>
          </div>
        </div>
        <button className="exit-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16}/> Exit
        </button>
      </div>

      {/* ── Chat window ── */}
      <div className="chat-window" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx}>
            <div className={`chat-bubble-container ${msg.role} animate-slide-up`}>
              <div className="avatar">
                {msg.role === 'ai' ? <Bot size={20}/> : <User size={20}/>}
              </div>
              <div className="bubble-content">
                {msg.followUpType && (
                  <span className={`follow-up-badge ${FOLLOW_UP_STYLES[msg.followUpType]?.className}`}>
                    {FOLLOW_UP_STYLES[msg.followUpType]?.label}
                  </span>
                )}
                {msg.isTransition && (
                  <span className="follow-up-badge badge-transition">➡️ Next Topic</span>
                )}
                <div className={`chat-bubble ${msg.role}`}>{msg.content}</div>
              </div>
            </div>

            {/* Show evaluation card below every user message */}
            {msg.role === 'user' && evaluations[idx] !== undefined && (
              <div className="eval-card-wrapper">
                <EvaluationCard
                  isLoading={evaluations[idx]?.isLoading}
                  evaluation={evaluations[idx]?.evaluation}
                  question={evaluations[idx]?.question}
                  answer={msg.content}
                  sessionId={sessionId}
                />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble-container ai animate-slide-up">
            <div className="avatar"><Bot size={20}/></div>
            <div className="bubble-content">
              <div className="chat-bubble ai">
                <div className="loading-dots"><span/><span/><span/></div>
              </div>
            </div>
          </div>
        )}

        {isFinished && (
          <div className="completion-card glass-panel animate-slide-up">
            <CheckCircle2 size={48} color="#10b981"/>
            <h3>Interview Completed</h3>
            <p>You've successfully answered all technical questions regarding your project.</p>
            <button className="primary-btn" onClick={() => navigate('/')}>Return Home</button>
          </div>
        )}
      </div>

      {/* ── Input ── */}
      {!isFinished && (
        <div className="chat-input-wrapper">
          {mode === 'followup' && !loading && (
            <div className="hint-bar">
              <Zap size={14}/>
              <span>AI will ask a follow-up. Answer or&nbsp;
                <button className="hint-skip" onClick={() => setMode('chat')}>skip to next question</button>.
              </span>
            </div>
          )}
          <div className="chat-input-area glass-panel">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder={mode === 'followup'
                ? 'Answer the follow-up…'
                : 'Type your technical answer… (Enter to send)'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <div className="input-actions">
              <button
                className="followup-btn"
                onClick={requestFollowUp}
                disabled={loading || messages.length < 2}
                title="Request a deeper follow-up"
              >
                <Zap size={18}/>
              </button>
              <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
                <Send size={22}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSession;
