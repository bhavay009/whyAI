import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, ArrowLeft } from 'lucide-react';
import './InterviewSession.css';

const InterviewSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { config, initialMessage } = location.state || {};

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/interview/chat', {
        history: newMessages,
        answer: input
      });
      setMessages([...newMessages, { role: 'ai', content: response.data.message }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages([...newMessages, { role: 'ai', content: "I'm sorry, I'm having trouble processing that. Could you try again? (Server might be down)" }]);
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

  return (
    <div className="session-container">
      <div className="session-header glass-panel">
        <div>
          <h2>WhyHire AI Simulator</h2>
          <p>{config.role} - {config.experienceLevel}</p>
        </div>
        <button className="primary-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => navigate('/')}>
          <ArrowLeft size={16} style={{ marginRight: "4px" }} /> Exit
        </button>
      </div>

      <div className="chat-window" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble-container ${msg.role} animate-slide-up`}>
            <div className={`chat-bubble ${msg.role}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble-container ai animate-slide-up">
            <div className="chat-bubble ai">
              <div className="loading-dots"><span></span><span></span><span></span></div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-area glass-panel">
        <textarea
          className="chat-input"
          placeholder="Type your answer... (Press Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
          <Send size={24} />
        </button>
      </div>
    </div>
  );
};

export default InterviewSession;
